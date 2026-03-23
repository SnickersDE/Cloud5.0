import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import type { FastSearchScope, UserFastSearchItem } from './content.types';
import { ContentService } from './content.service';
import type {
  FlashcardDeckDeleteInput,
  FlashcardDeckSaveInput,
  ModuleDeleteInput,
  ModuleSaveInput,
  QuizDeleteInput,
  QuizSaveInput,
} from './content.types';

@Controller('content')
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly authService: AuthService,
  ) {}

  private resolveFastSearchScope(value?: string): FastSearchScope {
    return value === 'flashcards' ? 'flashcards' : 'summaries';
  }

  @Get('sections')
  async getSections() {
    return this.contentService.getSections();
  }

  @Get('status')
  async getStatus() {
    return this.contentService.getConnectionStatus();
  }

  @Get('modules')
  async getModules(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = Number(limit ?? '5');
    const parsedOffset = Number(offset ?? '0');
    const safeLimit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 20)
      : 5;
    const safeOffset = Number.isFinite(parsedOffset)
      ? Math.max(parsedOffset, 0)
      : 0;

    return this.contentService.getModules(safeLimit, safeOffset);
  }

  @Post('modules/save')
  async saveModule(@Body() body: ModuleSaveInput) {
    return this.contentService.saveModuleDraft(body);
  }

  @Post('modules/delete')
  async deleteModule(@Body() body: ModuleDeleteInput) {
    return this.contentService.deleteModule(body);
  }

  @Get('flashcards/decks')
  async getFlashcardDecks(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = Number(limit ?? '5');
    const parsedOffset = Number(offset ?? '0');
    const safeLimit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 20)
      : 5;
    const safeOffset = Number.isFinite(parsedOffset)
      ? Math.max(parsedOffset, 0)
      : 0;

    return this.contentService.getFlashcardDecks(safeLimit, safeOffset);
  }

  @Post('flashcards/decks/save')
  async saveFlashcardDeck(@Body() body: FlashcardDeckSaveInput) {
    return this.contentService.saveFlashcardDeck(body);
  }

  @Post('flashcards/decks/delete')
  async deleteFlashcardDeck(@Body() body: FlashcardDeckDeleteInput) {
    return this.contentService.deleteFlashcardDeck(body);
  }

  @Get('quizzes')
  async getQuizzes(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = Number(limit ?? '6');
    const parsedOffset = Number(offset ?? '0');
    const safeLimit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 30)
      : 6;
    const safeOffset = Number.isFinite(parsedOffset)
      ? Math.max(parsedOffset, 0)
      : 0;

    return this.contentService.getQuizzes(safeLimit, safeOffset);
  }

  @Post('quizzes/save')
  async saveQuiz(@Body() body: QuizSaveInput) {
    return this.contentService.saveQuiz(body);
  }

  @Post('quizzes/delete')
  async deleteQuiz(@Body() body: QuizDeleteInput) {
    return this.contentService.deleteQuiz(body);
  }

  @Get('modules/fast-search')
  async getFastSearches(
    @Req() req: Request,
    @Query('scope') scope?: string,
  ): Promise<UserFastSearchItem[]> {
    const accessToken = req.cookies?.['sb-access-token'] as string | undefined;
    const user = await this.authService.me(accessToken);
    const userId = user?.id ?? '';
    if (!userId) {
      return [];
    }
    return this.contentService.getUserFastSearches(
      userId,
      this.resolveFastSearchScope(scope),
    );
  }

  @Post('modules/fast-search/save')
  async saveFastSearch(
    @Req() req: Request,
    @Body() body: { label?: string; scope?: string },
  ) {
    const accessToken = req.cookies?.['sb-access-token'] as string | undefined;
    const user = await this.authService.me(accessToken);
    const userId = user?.id ?? '';
    const label = body.label?.trim() ?? '';
    const scope = this.resolveFastSearchScope(body.scope);
    if (!userId || !label) {
      return { saved: false };
    }
    return this.contentService.saveUserFastSearch(userId, label, scope);
  }
}
