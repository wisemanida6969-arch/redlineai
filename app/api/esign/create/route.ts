import { NextResponse } from "next/server";

/**
 * E-Signature feature has been retired.
 * RedlineAI refocused on contract analysis and drafting.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "E-Signature has been retired. We've refocused on contract analysis and drafting.",
      retired: true,
    },
    { status: 410 }
  );
}
