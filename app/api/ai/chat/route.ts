import { NextRequest, NextResponse } from 'next/server';
import { generateAICompletion, AIClientConfig } from '@/utils/aiClient';

const COPILOT_SYSTEM_PROMPT = `
You are the DiaFlow AI Copilot, an elite Senior Cloud & Enterprise Systems Architect.
You assist developers and cloud architects in designing, reviewing, auditing, and optimizing system architectures.

Capabilities:
1. Explain the current architecture diagram and identify data flows.
2. Review for Security, Reliability, Single Points of Failure (SPOF), and Scaling Bottlenecks.
3. Suggest missing components (e.g. rate limiters, dead-letter queues, read-replicas, WAF).
4. Provide concrete implementation steps (AWS, GCP, Azure, or Kubernetes).

Style & Tone:
- Crisp, direct, and structured with Markdown headers, bullet points, and code/config snippets where helpful.
- Reference the specific nodes and connections provided in the context.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, contextDiagram, aiConfig, mode } = body;

    // Format diagram context for LLM
    let contextPrompt = '';
    if (contextDiagram && contextDiagram.nodes && contextDiagram.nodes.length > 0) {
      const nodeList = contextDiagram.nodes
        .map(
          (n: { id: string; type: string; data?: { label?: string; sublabel?: string } }) =>
            `- [${n.id}] Type: ${n.type}, Label: "${n.data?.label || n.type}"${
              n.data?.sublabel ? ` (${n.data.sublabel})` : ''
            }`
        )
        .join('\n');

      const edgeList = (contextDiagram.edges || [])
        .map(
          (e: { source: string; target: string; label?: string }) =>
            `- ${e.source} -> ${e.target}${e.label ? ` [${e.label}]` : ''}`
        )
        .join('\n');

      contextPrompt = `
CURRENT DIAGRAM CONTEXT ("${contextDiagram.name || 'Architecture'}"):
Nodes (${contextDiagram.nodes.length}):
${nodeList}

Connections (${(contextDiagram.edges || []).length}):
${edgeList}
`;
    } else {
      contextPrompt = '\nCURRENT DIAGRAM CONTEXT: The diagram canvas is currently empty.';
    }

    let userInstruction = '';
    if (mode === 'audit') {
      userInstruction = `Perform a comprehensive Security & Architecture Audit on the current diagram.
Evaluate:
1. Architecture Strengths
2. Security & Compliance Gaps (Encryption, Ingress, Auth, Secret Management)
3. High Availability & Failure Modes (SPOFs, Caching, DB Replicas)
4. Key Recommendations & Action Items`;
    } else if (mode === 'explain') {
      userInstruction = `Provide a clear, executive-level architecture overview and step-by-step request flow explanation for this system.`;
    } else {
      // Standard chat history
      const lastMessage =
        messages && messages.length > 0
          ? messages[messages.length - 1].content
          : 'Hello';
      userInstruction = lastMessage;
    }

    const fullPrompt = `${contextPrompt}\n\nUser Request: ${userInstruction}`;

    const reply = await generateAICompletion({
      systemPrompt: COPILOT_SYSTEM_PROMPT,
      userPrompt: fullPrompt,
      config: aiConfig as AIClientConfig,
    });

    return NextResponse.json({ reply: reply || 'Unable to analyze diagram.' });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process AI chat request' },
      { status: 500 }
    );
  }
}
