"use server";
import { generateCreative, type GenerateInput } from "@/lib/creative/generate";
export async function generateCreativeAction(input: GenerateInput) {
  return generateCreative(input);
}
