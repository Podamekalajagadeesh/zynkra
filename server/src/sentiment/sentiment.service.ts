import { Injectable, Logger } from '@nestjs/common';

export enum SentimentType {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

export interface SentimentAnalysisResult {
  sentiment: SentimentType;
  score: number; // -1 to 1, negative to positive
  confidence: number; // 0 to 1
  emotions?: {
    joy?: number;
    sadness?: number;
    anger?: number;
    fear?: number;
    surprise?: number;
  };
}

@Injectable()
export class SentimentService {
  private readonly logger = new Logger(SentimentService.name);
  
  // ---- Weighted lexicon: word -> weight (positive = positive sentiment, negative = negative) ----
  // Weights range from 0.1 (mild) to 1.0 (extreme).
  // In production, you would use a proper ML model or API like AWS Comprehend, Google Cloud Natural Language, etc.

  private sentimentLexicon: Map<string, number> = new Map([
    // ── Strong positive (0.7-1.0) ──
    ['love', 0.95], ['adore', 0.9], ['worship', 0.95], ['thrilled', 0.9], ['ecstatic', 1.0],
    ['elated', 0.9], ['euphoric', 1.0], ['overjoyed', 0.95], ['blissful', 0.9],
    ['incredible', 0.85], ['phenomenal', 0.9], ['magnificent', 0.9], ['spectacular', 0.85],
    ['extraordinary', 0.85], ['masterpiece', 0.95], ['flawless', 0.9], ['perfect', 0.95],
    ['outstanding', 0.85], ['superb', 0.85], ['excellent', 0.85], ['brilliant', 0.85],
    ['genius', 0.8], ['legendary', 0.85], ['iconic', 0.8], ['sublime', 0.9],
    ['triumph', 0.85], ['victory', 0.8], ['miracle', 0.85], ['breakthrough', 0.8],

    // ── Moderate positive (0.4-0.69) ──
    ['great', 0.65], ['awesome', 0.7], ['amazing', 0.75], ['fantastic', 0.7],
    ['wonderful', 0.7], ['beautiful', 0.7], ['impressive', 0.65], ['magnificent', 0.7],
    ['superb', 0.7], ['terrific', 0.65], ['splendid', 0.65], ['glorious', 0.7],
    ['marvelous', 0.65], ['fabulous', 0.65], ['stellar', 0.65], ['remarkable', 0.6],
    ['delightful', 0.6], ['charming', 0.55], ['enchanting', 0.6], ['captivating', 0.6],
    ['engaging', 0.5], ['enjoyable', 0.5], ['pleasant', 0.45], ['refreshing', 0.5],
    ['inspiring', 0.6], ['motivating', 0.55], ['uplifting', 0.6], ['empowering', 0.55],
    ['celebrate', 0.6], ['celebration', 0.6], ['triumph', 0.6], ['proud', 0.55],
    ['grateful', 0.55], ['thankful', 0.55], ['appreciate', 0.5], ['appreciation', 0.5],
    ['blessed', 0.55], ['blessing', 0.55], ['fortunate', 0.5], ['lucky', 0.45],
    ['kind', 0.45], ['generous', 0.5], ['caring', 0.5], ['compassionate', 0.5],
    ['supportive', 0.5], ['helpful', 0.45], ['thoughtful', 0.45], ['gentle', 0.4],
    ['warm', 0.4], ['cozy', 0.4], ['comfortable', 0.4], ['safe', 0.4],
    ['peaceful', 0.5], ['calm', 0.4], ['serene', 0.5], ['tranquil', 0.45],
    ['harmony', 0.5], ['balanced', 0.4], ['stable', 0.4], ['secure', 0.45],
    ['smart', 0.45], ['intelligent', 0.5], ['clever', 0.5], ['wise', 0.5],
    ['talented', 0.5], ['skilled', 0.45], ['gifted', 0.5], ['creative', 0.45],
    ['innovative', 0.5], ['inventive', 0.5], ['original', 0.4], ['unique', 0.4],
    ['authentic', 0.45], ['genuine', 0.45], ['sincere', 0.45], ['honest', 0.45],
    ['loyal', 0.45], ['faithful', 0.45], ['trustworthy', 0.5], ['reliable', 0.45],
    ['dependable', 0.45], ['responsible', 0.4], ['fair', 0.4], ['just', 0.4],
    ['brave', 0.5], ['courageous', 0.55], ['fearless', 0.55], ['bold', 0.5],
    ['determined', 0.5], ['resilient', 0.5], ['strong', 0.45], ['powerful', 0.5],
    ['healthy', 0.45], ['fit', 0.4], ['vibrant', 0.5], ['energetic', 0.5],
    ['lively', 0.45], ['dynamic', 0.45], ['passionate', 0.55], ['enthusiastic', 0.55],
    ['eager', 0.45], ['keen', 0.4], ['zealous', 0.5], ['fervent', 0.55],

    // ── Mild positive (0.1-0.39) ──
    ['good', 0.35], ['nice', 0.3], ['fine', 0.2], ['okay', 0.15], ['ok', 0.15],
    ['decent', 0.25], ['fair', 0.2], ['alright', 0.15], ['not bad', 0.25],
    ['like', 0.3], ['enjoy', 0.35], ['fond', 0.3], ['care', 0.3],
    ['hope', 0.3], ['wish', 0.2], ['glad', 0.35], ['content', 0.3],
    ['satisfied', 0.35], ['pleased', 0.35], ['relieved', 0.3],
    ['cool', 0.35], ['fun', 0.35], ['interesting', 0.3], ['useful', 0.3],
    ['convenient', 0.3], ['easy', 0.25], ['simple', 0.2], ['smooth', 0.3],
    ['clean', 0.25], ['neat', 0.25], ['tidy', 0.2], ['organized', 0.25],
    ['efficient', 0.3], ['effective', 0.3], ['productive', 0.35],
    ['progress', 0.35], ['improve', 0.3], ['improvement', 0.35], ['growth', 0.35],
    ['develop', 0.25], ['developing', 0.25], ['potential', 0.3],
    ['interesting', 0.3], ['curious', 0.25], ['fascinating', 0.5],
    ['new', 0.15], ['fresh', 0.2], ['modern', 0.2], ['updated', 0.25],

    // ── Positive exclamations / interjections ──
    ['yay', 0.6], ['woo', 0.5], ['hurray', 0.6], ['bravo', 0.6], ['kudos', 0.5],
    ['cheers', 0.4], ['haha', 0.3], ['lol', 0.25], ['lmao', 0.3], ['rofl', 0.35],
    ['woohoo', 0.55], ['yes', 0.35], ['hell yeah', 0.6], ['let\'s go', 0.5],

    // ── Strong negative (0.7-1.0) ──
    ['hate', -0.9], ['despise', -0.95], ['loathe', -0.95], ['detest', -0.9],
    ['abhor', -0.95], ['revolt', -0.85], ['repulse', -0.85],
    ['furious', -0.85], ['enraged', -0.9], ['livid', -0.85], ['infuriated', -0.85],
    ['outraged', -0.85], ['incensed', -0.85], ['seething', -0.85],
    ['devastated', -0.9], ['heartbroken', -0.85], ['shattered', -0.85], ['crushed', -0.85],
    ['miserable', -0.8], ['wretched', -0.85], ['agonizing', -0.85], ['tormented', -0.85],
    ['catastrophic', -0.85], ['disastrous', -0.85], ['tragic', -0.85], ['horrifying', -0.85],
    ['terrifying', -0.85], ['nightmarish', -0.9], ['appalling', -0.85], ['atrocious', -0.85],
    ['abysmal', -0.8], ['horrendous', -0.85], ['unacceptable', -0.75], ['intolerable', -0.8],
    ['monstrous', -0.85], ['vile', -0.85], ['wicked', -0.75], ['evil', -0.8],
    ['sadistic', -0.85], ['malicious', -0.8], ['spiteful', -0.75], ['vindictive', -0.75],
    ['nuclear', -0.7], ['toxic', -0.75], ['poison', -0.75], ['cancer', -0.7],
    ['plague', -0.7], ['epidemic', -0.6], ['disaster', -0.75], ['ruin', -0.7],
    ['destroy', -0.75], ['devastate', -0.8], ['annihilate', -0.85], ['obliterate', -0.85],
    ['murder', -0.85], ['kill', -0.7], ['suicide', -0.8], ['die', -0.65],
    ['dead', -0.6], ['death', -0.7], ['dying', -0.7], ['grave', -0.65],

    // ── Moderate negative (0.4-0.69) ──
    ['bad', -0.5], ['terrible', -0.7], ['awful', -0.7], ['horrible', -0.7],
    ['disgusting', -0.7], ['gross', -0.5], ['nasty', -0.6], ['vile', -0.7],
    ['pathetic', -0.65], ['pathetic', -0.65], ['useless', -0.55], ['worthless', -0.65],
    ['trash', -0.6], ['garbage', -0.6], ['rubbish', -0.55], ['junk', -0.5],
    ['crap', -0.6], ['shit', -0.65], ['bullshit', -0.7], ['bs', -0.5],
    ['stupid', -0.6], ['idiot', -0.6], ['dumb', -0.55], ['moron', -0.6],
    ['imbecile', -0.6], ['fool', -0.5], ['foolish', -0.5], ['clueless', -0.5],
    ['ignorant', -0.55], ['incompetent', -0.6], ['inept', -0.55], ['useless', -0.55],
    ['disappointed', -0.55], ['disappointing', -0.55], ['letdown', -0.55],
    ['frustrating', -0.6], ['frustrated', -0.6], ['irritating', -0.55], ['annoying', -0.55],
    ['angering', -0.6], ['aggravating', -0.55], ['maddening', -0.6], ['infuriating', -0.65],
    ['boring', -0.4], ['bored', -0.35], ['dull', -0.4], ['tedious', -0.45],
    ['monotonous', -0.4], ['tiresome', -0.4], ['uninspiring', -0.4], ['mediocre', -0.35],
    ['lousy', -0.5], ['shabby', -0.45], ['poor', -0.45], ['inferior', -0.5],
    ['subpar', -0.4], ['deficient', -0.45], ['lacking', -0.35], ['inadequate', -0.45],
    ['ugly', -0.55], ['hideous', -0.7], ['repulsive', -0.65], ['unattractive', -0.45],
    ['unpleasant', -0.45], ['distasteful', -0.5], ['offensive', -0.55], ['insulting', -0.6],
    ['arrogant', -0.5], ['cocky', -0.45], ['conceited', -0.45], ['smug', -0.45],
    ['narcissistic', -0.55], ['selfish', -0.5], ['greedy', -0.5], ['corrupt', -0.6],
    ['crooked', -0.5], ['shady', -0.45], ['suspicious', -0.4], ['deceitful', -0.55],
    ['lying', -0.5], ['liar', -0.55], ['cheater', -0.55], ['scam', -0.6],
    ['fraud', -0.6], ['fake', -0.5], ['counterfeit', -0.55], ['phony', -0.5],
    ['hypocrite', -0.55], ['hypocritical', -0.55], ['manipulative', -0.55],
    ['abusive', -0.65], ['bully', -0.6], ['bullying', -0.6], ['cruel', -0.6],
    ['mean', -0.45], ['rude', -0.45], ['disrespectful', -0.5], ['offensive', -0.5],
    ['obnoxious', -0.55], ['repugnant', -0.6], ['insufferable', -0.6], ['intolerable', -0.6],

    // ── Mild negative (0.1-0.39) ──
    ['sad', -0.4], ['unhappy', -0.4], ['down', -0.3], ['low', -0.25],
    ['depressed', -0.5], ['melancholy', -0.4], ['gloomy', -0.35], ['somber', -0.3],
    ['somber', -0.3], ['moody', -0.3], ['glum', -0.35], ['dreary', -0.35],
    ['worried', -0.35], ['anxious', -0.4], ['nervous', -0.35], ['stressed', -0.4],
    ['tense', -0.3], ['uneasy', -0.3], ['troubled', -0.35], ['concerned', -0.25],
    ['scared', -0.45], ['afraid', -0.4], ['fearful', -0.45], ['frightened', -0.45],
    ['terrified', -0.55], ['panicked', -0.5], ['alarmed', -0.35], ['startled', -0.3],
    ['angry', -0.5], ['mad', -0.45], ['pissed', -0.5], ['irritated', -0.4],
    ['annoyed', -0.35], ['agitated', -0.4], ['bothered', -0.3], ['irked', -0.35],
    ['dislike', -0.35], ['aversion', -0.4], ['distaste', -0.35], ['repugnance', -0.5],
    ['regret', -0.4], ['remorse', -0.45], ['guilty', -0.4], ['ashamed', -0.45],
    ['embarrassed', -0.35], ['humiliated', -0.5], ['mortified', -0.5],
    ['tired', -0.25], ['exhausted', -0.35], ['drained', -0.35], ['worn out', -0.3],
    ['bored', -0.3], ['apathetic', -0.35], ['indifferent', -0.2], ['numb', -0.3],
    ['confused', -0.25], ['puzzled', -0.2], ['bewildered', -0.3], ['lost', -0.3],
    ['uncertain', -0.2], ['doubtful', -0.25], ['skeptical', -0.2], ['cynical', -0.35],
    ['wrong', -0.35], ['mistake', -0.35], ['error', -0.3], ['flaw', -0.3],
    ['defect', -0.35], ['bug', -0.25], ['broken', -0.35], ['damaged', -0.3],
    ['corrupt', -0.5], ['illegal', -0.5], ['unethical', -0.45], ['immoral', -0.45],
    ['lazy', -0.35], ['sluggish', -0.3], ['lethargic', -0.3], ['unmotivated', -0.3],
    ['weak', -0.3], ['feeble', -0.35], ['frail', -0.3], ['fragile', -0.25],
    ['cheap', -0.3], ['expensive', -0.25], ['overpriced', -0.35], ['ripoff', -0.45],

    // ── Negative slang / profanity ──
    ['fuck', -0.7], ['fucking', -0.7], ['fucked', -0.75], ['dammit', -0.5],
    ['damn', -0.45], ['damned', -0.55], ['sucks', -0.5], ['suck', -0.45],
    ['screw', -0.35], ['screwed', -0.45], ['bitch', -0.6], ['ass', -0.4],
    ['asshole', -0.65], ['dick', -0.5], ['douche', -0.55], ['dumbass', -0.55],
    ['jackass', -0.5], ['dipshit', -0.55], ['dumbfuck', -0.6],
    ['wtf', -0.5], ['smh', -0.35], ['tf', -0.45], ['stfu', -0.6],
    ['lame', -0.4], ['weak sauce', -0.4], ['noob', -0.3], ['rookie', -0.2],

    // ── Spanish ──
    ['bueno', 0.4], ['bonito', 0.45], ['hermoso', 0.6], ['genial', 0.65],
    ['excelente', 0.8], ['increíble', 0.8], ['fantástico', 0.7], ['maravilloso', 0.75],
    ['gracias', 0.4], ['amor', 0.8], ['felicidad', 0.75], ['contento', 0.5],
    ['perfecto', 0.85], ['increíble', 0.8], ['divertido', 0.5], ['agradable', 0.45],
    ['malo', -0.5], ['terrible', -0.7], ['horrible', -0.7], ['odio', -0.9],
    ['triste', -0.5], ['enfadado', -0.55], ['feo', -0.5], ['asqueroso', -0.7],
    ['estúpido', -0.6], ['idiota', -0.6], ['desastre', -0.7], ['peor', -0.7],
    ['lástima', -0.4], ['pena', -0.45], ['preocupado', -0.35], ['miedo', -0.45],

    // ── Portuguese ──
    ['bom', 0.4], ['ótimo', 0.7], ['excelente', 0.8], ['incrível', 0.8],
    ['maravilhoso', 0.75], ['lindo', 0.6], ['legal', 0.4], ['obrigado', 0.4],
    ['amor', 0.8], ['feliz', 0.65], ['perfeito', 0.85],
    ['ruim', -0.5], ['péssimo', -0.8], ['horrível', -0.7], ['odio', -0.9],
    ['triste', -0.5], ['raiva', -0.55], ['feio', -0.5],

    // ── French ──
    ['bon', 0.4], ['excellent', 0.8], ['magnifique', 0.75], ['incroyable', 0.8],
    ['formidable', 0.7], ['génial', 0.65], ['merci', 0.4], ['amour', 0.8],
    ['heureux', 0.65], ['parfait', 0.85], ['joli', 0.45], ['agréable', 0.45],
    ['mauvais', -0.5], ['terrible', -0.7], ['horrible', -0.7], ['déteste', -0.9],
    ['triste', -0.5], ['en colère', -0.55], ['laid', -0.5],

    // ── German ──
    ['gut', 0.4], ['großartig', 0.7], ['wunderbar', 0.7], ['fantastisch', 0.75],
    ['perfekt', 0.85], ['schön', 0.5], ['danke', 0.4], ['liebe', 0.8],
    ['glücklich', 0.65], ['toll', 0.6], ['super', 0.6],
    ['schlecht', -0.5], ['schrecklich', -0.7], ['furchtbar', -0.75], ['hasse', -0.9],
    ['traurig', -0.5], ['wütend', -0.55], ['hässlich', -0.5],

    // ── Japanese (romaji) ──
    ['ii', 0.3], ['sugoi', 0.7], ['suteki', 0.6], ['daisuki', 0.85],
    ['yokatta', 0.5], ['arigatou', 0.4], ['tanoshii', 0.5], ['kirei', 0.5],
    ['warui', -0.5], ['hidoi', -0.65], ['zannen', -0.35], ['dame', -0.3],

    // ── Arabic (transliterated) ──
    ['jamil', 0.5], ['mumtaz', 0.6], ['ra\'i', 0.55], ['shukran', 0.4],
    ['hub', 0.8], ['sa\'eed', 0.6], ['jiddan jayyid', 0.7],
    ['sayyi', -0.5], ['qabih', -0.55], ['sa\'ib', -0.4],

    // ── Hindi (transliterated) ──
    ['accha', 0.4], ['bahut accha', 0.65], ['shandar', 0.7], ['zabardast', 0.75],
    ['pyar', 0.8], ['khush', 0.65], ['dhanyavaad', 0.4],
    ['bura', -0.5], ['kharab', -0.5], ['gussa', -0.55], ['dukhi', -0.45],
  ]);

  // Negation words that flip sentiment of the following word
  private negationWords = new Set([
    'not', 'no', 'never', 'neither', 'nor', 'nobody', 'nothing',
    'nowhere', 'hardly', 'barely', 'scarcely', 'seldom', 'rarely',
    'without', 'dont', "don't", 'doesnt', "doesn't", 'didnt', "didn't",
    'wont', "won't", 'cant', "can't", 'couldnt', "couldn't",
    'wouldnt', "wouldn't", 'shouldnt', "shouldn't", 'isnt', "isn't",
    'arent', "aren't", 'wasnt', "wasn't", 'werent', "weren't",
    'hasnt', "hasn't", 'havent', "haven't", 'hadnt', "hadn't",
    'non', 'ni', 'jamais', 'nicht', 'kein', 'keine', 'keinen',
    'no es', 'no está', 'pas', 'ne pas',
  ]);

  // Amplifiers increase the magnitude of the following word's sentiment
  private amplifiers = new Map<string, number>([
    ['very', 1.5], ['really', 1.5], ['extremely', 2.0], ['incredibly', 2.0],
    ['absolutely', 2.0], ['totally', 1.6], ['completely', 1.7], ['utterly', 1.8],
    ['highly', 1.5], ['deeply', 1.6], ['profoundly', 1.8], ['immensely', 1.8],
    ['enormously', 1.7], ['tremendously', 1.7], ['exceedingly', 1.7],
    ['remarkably', 1.5], ['exceptionally', 1.7], ['supremely', 1.8],
    ['intensely', 1.6], ['terribly', 1.5], ['awfully', 1.5],
    ['so', 1.4], ['such', 1.3], ['quite', 1.2], ['pretty', 1.2],
    ['fairly', 1.1], ['rather', 1.1], ['somewhat', 0.8],
    ['slightly', 0.7], ['barely', 0.6], ['hardly', 0.6],
    ['truly', 1.5], ['genuinely', 1.4], ['seriously', 1.4],
    ['freaking', 1.6], ['damn', 1.5], ['fucking', 1.8],
    ['especial', 1.5], ['sobremanera', 1.6], ['muy', 1.4], ['bastante', 1.2],
    ['très', 1.5], ['fortement', 1.5], ['vraiment', 1.4],
    ['sehr', 1.5], ['extrem', 1.8], ['wirklich', 1.4],
    ['bahut', 1.5], ['jyada', 1.3], ['zara', 0.8],
    ['jiddan', 1.5], ['jiddiyyan', 1.7],
    ['totally', 1.6], ['literally', 1.5],
  ]);

  // Sarcasm indicators: emoticons, repeated punctuation, ALL-CAPS patterns
  private sarcasmEmoticons = ['/s', '/S', ':-)', ':)', '-_-', 'rollseyes', 'eyeroll'];
  private sarcasmPatterns = [
    /yeah right/i,
    /oh great/i,
    /oh wonderful/i,
    /oh joy/i,
    /oh fantastic/i,
    /oh amazing/i,
    /sure thing/i,
    /totally not/i,
    /obviously/i,
    /as if/i,
    /what a surprise/i,
    /wow just wow/i,
    /oh really/i,
    /tell me about it/i,
  ];

  async analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
    this.logger.log(`Analyzing sentiment for text: ${text.substring(0, 100)}...`);

    const lowerText = text.toLowerCase();
    const tokens = lowerText.split(/\s+/);
    const words = lowerText.split(/\W+/).filter(w => w.length > 0);

    let weightedScore = 0;
    let sentimentWordCount = 0;
    let negateNext = false;
    let amplifyNext = 1;

    // Check for sarcasm indicators
    const sarcasmScore = this.detectSarcasm(text);

    // Process tokens for negation and amplifier context
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].replace(/[^a-zÀ-ɏ؀-ۿ぀-ゟ゠-ヿऀ-ॿ]/g, '');

      if (this.negationWords.has(token)) {
        negateNext = true;
        continue;
      }

      if (this.amplifiers.has(token)) {
        amplifyNext = this.amplifiers.get(token)!;
        continue;
      }

      const lexiconScore = this.sentimentLexicon.get(token) ?? 0;
      if (lexiconScore !== 0) {
        let effectiveScore = lexiconScore * amplifyNext;

        // Negation flips the sign and slightly reduces magnitude
        if (negateNext) {
          effectiveScore = -effectiveScore * 0.75;
          negateNext = false;
        }

        weightedScore += effectiveScore;
        sentimentWordCount++;
        amplifyNext = 1; // reset amplifier after use
      } else {
        // Reset negation if a non-sentiment, non-amplifier word appears
        // (negation scope is limited to the next sentiment word)
        if (!this.amplifiers.has(token)) {
          negateNext = false;
        }
      }
    }

    // Also check multi-word phrases in the full lower text
    const phraseScore = this.scoreMultiWordPhrases(lowerText);
    weightedScore += phraseScore.score;
    sentimentWordCount += phraseScore.count;

    // Apply sarcasm detection: if sarcasm is detected and sentiment is positive,
    // flip to negative (common sarcasm pattern: positive words used sarcastically)
    if (sarcasmScore > 0.5 && weightedScore > 0) {
      weightedScore = -weightedScore * sarcasmScore;
    }

    // Normalize score to [-1, 1] range using a logistic-ish function
    const normalizedScore = sentimentWordCount > 0
      ? Math.tanh(weightedScore / Math.max(sentimentWordCount * 0.5, 1))
      : 0;

    let sentiment: SentimentType;
    if (normalizedScore > 0.15) {
      sentiment = SentimentType.POSITIVE;
    } else if (normalizedScore < -0.15) {
      sentiment = SentimentType.NEGATIVE;
    } else {
      sentiment = SentimentType.NEUTRAL;
    }

    // Confidence based on sentiment word density and text length
    const totalMeaningfulWords = words.filter(w => w.length > 2).length;
    const sentimentDensity = totalMeaningfulWords > 0 ? sentimentWordCount / totalMeaningfulWords : 0;
    const lengthFactor = Math.min(totalMeaningfulWords / 10, 1); // longer texts give more confidence
    const confidence = sentimentWordCount > 0
      ? Math.min(0.4 + sentimentDensity * 0.4 + lengthFactor * 0.15 + (sarcasmScore > 0.5 ? 0.1 : 0), 0.95)
      : 0.3;

    // Improved emotion detection
    const emotions = this.detectEmotions(text, words);

    const result: SentimentAnalysisResult = {
      sentiment,
      score: Math.max(-1, Math.min(1, normalizedScore)),
      confidence,
      emotions,
    };

    this.logger.log(`Sentiment analysis complete: ${JSON.stringify(result)}`);
    return result;
  }

  /**
   * Score multi-word phrases that carry sentiment.
   * Checks for common phrases like "can't wait", "so happy", "not bad", etc.
   */
  private scoreMultiWordPhrases(text: string): { score: number; count: number } {
    const phrases = [
      // Positive phrases
      { pattern: /can't wait/g, score: 0.6 },
      { pattern: /looking forward/g, score: 0.5 },
      { pattern: /can't stop smiling/g, score: 0.8 },
      { pattern: /made my day/g, score: 0.7 },
      { pattern: /blown away/g, score: 0.65 },
      { pattern: /on top of the world/g, score: 0.8 },
      { pattern: /over the moon/g, score: 0.75 },
      { pattern: /in love with/g, score: 0.8 },
      { pattern: /blow.* away/g, score: 0.6 },
      { pattern: /top notch/g, score: 0.6 },
      { pattern: /state of the art/g, score: 0.55 },
      { pattern: /out of this world/g, score: 0.7 },
      { pattern: /one of a kind/g, score: 0.5 },
      { pattern: /head over heels/g, score: 0.7 },
      { pattern: /piece of cake/g, score: 0.3 },
      { pattern: /highly recommend/g, score: 0.65 },
      { pattern: /well done/g, score: 0.5 },
      { pattern: /good job/g, score: 0.5 },
      { pattern: /nice work/g, score: 0.45 },
      { pattern: /keep it up/g, score: 0.5 },
      { pattern: /way to go/g, score: 0.55 },

      // Negative phrases
      { pattern: /waste of time/g, score: -0.6 },
      { pattern: /waste of money/g, score: -0.6 },
      { pattern: /rip off/g, score: -0.6 },
      { pattern: /fed up/g, score: -0.5 },
      { pattern: /sick and tired/g, score: -0.6 },
      { pattern: /give up/g, score: -0.4 },
      { pattern: /down the drain/g, score: -0.55 },
      { pattern: /pain in the ass/g, score: -0.55 },
      { pattern: /couldn't care less/g, score: -0.5 },
      { pattern: /break my heart/g, score: -0.65 },
      { pattern: /drives me crazy/g, score: -0.5 },
      { pattern: /gets on my nerves/g, score: -0.5 },
      { pattern: /under the weather/g, score: -0.35 },
      { pattern: /at wit's end/g, score: -0.55 },
      { pattern: /hit rock bottom/g, score: -0.65 },
      { pattern: /let me down/g, score: -0.5 },
      { pattern: /blow it/g, score: -0.4 },
      { pattern: /in the red/g, score: -0.35 },
      { pattern: /on thin ice/g, score: -0.4 },

      // Neutralizing phrases (reduce existing sentiment)
      { pattern: /it's okay/i, score: 0 },
      { pattern: /not bad/i, score: 0.25 },
      { pattern: /could be worse/i, score: -0.1 },
      { pattern: /so-so/i, score: 0 },
      { pattern: /neither here nor there/i, score: 0 },
    ];

    let score = 0;
    let count = 0;
    for (const phrase of phrases) {
      const matches = text.match(phrase.pattern);
      if (matches) {
        score += phrase.score * matches.length;
        count += matches.length;
      }
    }
    return { score, count };
  }

  /**
   * Detect sarcasm in text based on emoticons, punctuation patterns, and known sarcastic phrases.
   * Returns a score from 0 (no sarcasm) to 1 (likely sarcasm).
   */
  private detectSarcasm(text: string): number {
    let sarcasmScore = 0;
    const lowerText = text.toLowerCase();

    // Check for explicit sarcasm tags like "/s"
    for (const emoticon of this.sarcasmEmoticons) {
      if (lowerText.includes(emoticon)) {
        sarcasmScore += 0.5;
      }
    }

    // Check for known sarcastic phrases
    for (const pattern of this.sarcasmPatterns) {
      if (pattern.test(text)) {
        sarcasmScore += 0.3;
      }
    }

    // Excessive exclamation marks after short statements often indicate sarcasm
    const exclamationMatches = text.match(/!{2,}/g);
    if (exclamationMatches && text.split(/\s+/).length < 10) {
      sarcasmScore += 0.15;
    }

    // Alternating caps (lIkE tHiS) is a sarcasm convention
    if (/[a-z][A-Z][a-z][A-Z]/.test(text) && text.length > 6) {
      sarcasmScore += 0.2;
    }

    // Ellipsis after a positive word can signal sarcasm
    if (/[.]{2,}\s*(great|wonderful|perfect|lovely|fantastic)/i.test(text)) {
      sarcasmScore += 0.2;
    }

    return Math.min(sarcasmScore, 1);
  }

  private detectEmotions(
    text: string,
    words: string[],
  ): SentimentAnalysisResult['emotions'] {
    const lowerText = text.toLowerCase();
    const emotions: SentimentAnalysisResult['emotions'] = {};

    // Expanded emotion word groups with weights
    const emotionGroups: Record<string, { words: RegExp; weights: number[] }> = {
      joy: {
        words: /\b(happy|joyful|joy|elated|ecstatic|excited|thrilled|delighted|love|adore|awesome|great|fantastic|wonderful|amazing|beautiful|blissful|euphoric|overjoyed|grateful|thankful|blessed|celebrate|celebration|proud|cheerful|gleeful|jubilant|radiant|smile|smiling|laugh|laughing|haha|lol|yay|woohoo|hooray|bravo|cheers|amazing|best|favorite|perfect|incredible)\b/g,
        weights: [0.9, 0.85, 0.95, 1.0, 0.75, 0.8, 0.85, 0.8, 0.7, 0.75, 0.65, 0.7, 0.7, 0.6, 0.8, 0.65, 0.75, 0.7, 0.85, 0.8, 0.7, 0.55, 0.6, 0.75, 0.65, 0.7, 0.55, 0.5, 0.55, 0.6, 0.5, 0.5, 0.6, 0.55, 0.65, 0.6, 0.65, 0.7, 0.8, 0.75, 0.95],
      },
      sadness: {
        words: /\b(sad|unhappy|depressed|depression|heartbroken|miserable|disappointed|grief|grieving|sorrow|sorrowful|melancholy|gloomy|somber|glum|down|blue|tear|tears|crying|cry|weeping|weep|lonely|alone|lost|hollow|empty|numb|helpless|hopeless|despair|despairing|regret|regretful|remorse|guilty|shame|ashamed|devastated|crushed|shattered|broken|wretched|forlorn|desolate|woeful|plaintive|despondent|mourn|mourning|lament)\b/g,
        weights: [0.65, 0.6, 0.85, 0.8, 0.8, 0.75, 0.6, 0.7, 0.65, 0.7, 0.65, 0.6, 0.55, 0.6, 0.5, 0.55, 0.5, 0.55, 0.5, 0.65, 0.55, 0.7, 0.65, 0.5, 0.55, 0.5, 0.6, 0.55, 0.5, 0.65, 0.7, 0.7, 0.8, 0.75, 0.6, 0.55, 0.65, 0.6, 0.55, 0.5, 0.6, 0.65, 0.6],
      },
      anger: {
        words: /\b(angry|furious|mad|pissed|outraged|infuriated|annoyed|irritated|aggravated|enraged|livid|irate|incensed|seething|hostile|bitter|resentful|hate|hating|loathe|despise|contempt|hatred|rage|raging|frustrated|frustrating|agitated|bothered|irked|exasperated|indignant|provoked|offended|insulted|disgusted|revolted|appalled|abhor|detest)\b/g,
        weights: [0.65, 0.8, 0.6, 0.65, 0.75, 0.8, 0.55, 0.55, 0.6, 0.85, 0.8, 0.7, 0.75, 0.7, 0.65, 0.6, 0.7, 0.85, 0.85, 0.7, 0.75, 0.65, 0.55, 0.55, 0.55, 0.6, 0.6, 0.5, 0.55, 0.6, 0.65, 0.6, 0.65, 0.85, 0.85, 0.8],
      },
      fear: {
        words: /\b(scared|afraid|terrified|worried|anxious|nervous|fearful|fear|frightened|alarmed|startled|panicked|paranoid|dread|dreading|uneasy|tense|apprehensive|concerned|concern|worry|worrying|stressed|stress|overwhelmed|vulnerable|insecure|intimidated|threatened|phobia|creeped|creepy|spooked|haunted|nightmare|catastroph|doom)\b/g,
        weights: [0.6, 0.55, 0.75, 0.5, 0.55, 0.5, 0.6, 0.65, 0.65, 0.5, 0.45, 0.65, 0.5, 0.6, 0.55, 0.45, 0.45, 0.5, 0.45, 0.5, 0.55, 0.55, 0.55, 0.5, 0.5, 0.45, 0.4, 0.5, 0.45, 0.45, 0.6, 0.55, 0.65, 0.7],
      },
      surprise: {
        words: /\b(wow|surprised|surprise|shocked|shock|amazed|amaze|astonished|astounded|stunned|unbelievable|incredible|unexpected|unanticipated|whoa|whoops|omg|oh my god|oh my|gosh|geez|jeez|what|no way|seriously|unreal|mind.blowing|jaw.drop|speechless|baffled|bewildered|flabbergasted)\b/g,
        weights: [0.65, 0.6, 0.65, 0.7, 0.65, 0.7, 0.65, 0.75, 0.7, 0.65, 0.7, 0.6, 0.55, 0.5, 0.55, 0.5, 0.5, 0.55, 0.5, 0.5, 0.5, 0.55, 0.6, 0.65, 0.75, 0.65, 0.6, 0.65, 0.7],
      },
    };

    // Count matches and compute weighted emotion scores
    for (const [emotion, { words: regex, weights }] of Object.entries(emotionGroups)) {
      const matches = lowerText.match(regex);
      if (matches && matches.length > 0) {
        // Sum up weights for all matches, capped at 1.0
        let totalWeight = 0;
        for (let i = 0; i < matches.length && i < weights.length; i++) {
          totalWeight += weights[i];
        }
        // Multiple matches increase confidence but with diminishing returns
        const emotionScore = Math.min(totalWeight * (1 / Math.log2(matches.length + 1)), 1.0);
        emotions[emotion as keyof typeof emotions] = Math.round(emotionScore * 100) / 100;
      }
    }

    // If no emotion detected but text is very short, mark as neutral surprise for single exclamations
    if (Object.keys(emotions).length === 0 && text.length < 20 && /[!]{2,}/.test(text)) {
      emotions.surprise = 0.3;
    }

    return emotions;
  }
}