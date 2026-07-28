/**
 * How many questions the interview gets.
 *
 * Kept in step with MAX_INTERVIEW_QUESTIONS in
 * artifacts/api-server/src/routes/nextleap/engine.ts, which is where it is
 * actually enforced — the server force-finishes the interview at this count
 * whatever the model returns, so the progress dots here are telling the truth
 * rather than making a promise the prompt might break.
 */
export const MAX_INTERVIEW_QUESTIONS = 5;
