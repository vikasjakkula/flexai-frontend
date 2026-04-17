import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { requireAuth } from '@/utils/auth';
import { TestRepository } from '@/lib/repositories/test.repository';
import { canAccessRankEstimation } from '@/utils/premium';

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const userId = await requireAuth();

    const body = await request.json();
    const { score, resultId } = body;

    // Allow rank estimation for trial results without PRO; otherwise require PRO
    if (resultId) {
      const repository = new TestRepository();
      const result = await repository.getResultById(resultId, userId);
      if (result?.is_trial) {
        // Trial result: allow rank estimation (score should be normalized to 160 scale by client)
      } else {
        const hasAccess = await canAccessRankEstimation(userId);
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'PRO subscription required for rank estimation', requiresUpgrade: true },
            { status: 403 }
          );
        }
      }
    } else {
      const hasAccess = await canAccessRankEstimation(userId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'PRO subscription required for rank estimation', requiresUpgrade: true },
          { status: 403 }
        );
      }
    }

    if (typeof score !== 'number') {
      return NextResponse.json({ error: 'Score must be a number' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const tools = [
      {
        googleSearch: {},
      },
    ];

    const config = {
      tools,
      systemInstruction: [
        {
          text: `Overall Score,Expected Rank
135+,1-100
134-120,101-200
119-110,201-500
109-100,501-1000
99-85,1001-2000
84-80,2001-3000
79-77,3001-4000
76-73,4001-5000
72-64,5001-10000
63-60,10001-15000
59-57,15001-20000
56-55,20001-25000
54-53,25001-30000
52-51,30001-40000
50-49,40001-50000
48-47,50001-65000
46,65001-Last

The max rank is 350000. so range should be within this range.

You will be given a score and you need to return an estimated rank and a range very very close range. 

for example 59 means you need to give 15,300 rank and range as 13,000-16,000 

in json

No explanation or anything just return JSON`,
        },
      ],
    };

    const model = 'gemini-3-flash-preview';

    const contents = [
      {
        role: 'user' as const,
        parts: [
          {
            text: `Score: ${score}`,
          },
        ],
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let fullText = '';
    for await (const chunk of response) {
      if (chunk.text) {
        fullText += chunk.text;
      }
    }

    // Parse JSON from response
    let rankData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        rankData = JSON.parse(jsonMatch[0]);
      } else {
        rankData = JSON.parse(fullText);
      }
    } catch (parseError) {
      // Fallback: try to extract numbers from text
      const rankMatch = fullText.match(/rank[:\s]*(\d+)/i);
      const rangeMatch = fullText.match(/range[:\s]*(\d+)[\s-]+(\d+)/i);
      
      if (rankMatch && rangeMatch) {
        rankData = {
          estimatedRank: parseInt(rankMatch[1]),
          rankRange: `${rangeMatch[1]}-${rangeMatch[2]}`,
        };
      } else {
        throw new Error('Failed to parse rank data from response');
      }
    }

    const rankEstimateData = {
      estimatedRank: rankData.estimatedRank || rankData.rank || rankData.estimated_rank,
      rankRange: rankData.rankRange || rankData.range || rankData.rank_range,
    };

    // Store estimated rank in test_results table if resultId is provided
    if (resultId) {
      try {
        const repository = new TestRepository();
        await repository.updateEstimatedRank(resultId, userId, rankEstimateData);
      } catch (storeError) {
        // Log error but don't fail the request - rank was generated successfully
        console.error('Failed to store estimated rank:', storeError);
      }
    }

    return NextResponse.json({
      success: true,
      data: rankEstimateData,
    });
  } catch (error) {
    console.error('Error estimating rank:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to estimate rank' },
      { status: 500 }
    );
  }
}




