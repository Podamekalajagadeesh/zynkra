/**
 * Q&A — NOT IMPLEMENTED.
 *
 * This was headed "Status: Implemented feature registry" and returned
 * `{ implemented: true }` from every method, which is the same lie the client
 * placeholder files were telling. It logs to the console, touches no database,
 * and has no module registering it, so it was never reachable over HTTP.
 *
 * Kept only so the import path does not break. `NOT_IMPLEMENTED` is returned
 * so a caller that somehow reaches this gets the truth rather than a fake
 * success.
 */

export class QaService {
  private notImplemented(): never {
    throw new Error(
      'Q&A is not implemented. Do not call this — see server/src/features/qa/qa.service.ts.',
    );
  }

  async askQuestion(_question: string): Promise<never> {
    return this.notImplemented();
  }

  async answerQuestion(_questionId: string): Promise<never> {
    return this.notImplemented();
  }

  async getQuestionFeed(): Promise<never> {
    return this.notImplemented();
  }

  async getTrendingQuestions(): Promise<never> {
    return this.notImplemented();
  }
}

export const qaService = new QaService();
