export class AnalyzeContentDto {
  content: string;
  contentType: 'post' | 'comment' | 'message' | 'reel';
  contentId: string;
  mediaUrls?: string[];
}