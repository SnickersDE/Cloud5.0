import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ContentService } from './content.service';
import type {
  FlashcardDeckDeleteInput,
  FlashcardDeckSaveInput,
  ModuleDeleteInput,
  ModuleSaveInput,
} from './content.types';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

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
}
