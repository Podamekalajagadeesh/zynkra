import { Injectable } from '@nestjs/common';
import { THEMES, ThemeDefinition } from '../users/themes.enum';

@Injectable()
export class ThemesService {
  list(): ThemeDefinition[] {
    return THEMES;
  }

  validate(key: string): boolean {
    return THEMES.some((theme) => theme.key === key);
  }
}
