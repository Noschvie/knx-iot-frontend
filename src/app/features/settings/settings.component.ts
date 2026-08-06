import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SUPPORTED_LANGUAGES, SupportedLanguage, LANGUAGE_STORAGE_KEY } from '@core/i18n/i18n.constants';

@Component({
  standalone: false,
  selector: 'app-settings',
  template: `
    <h2>{{ 'settings.title' | translate }}</h2>
    <div class="setting-row">
      <label for="languageSelect">{{ 'settings.language.label' | translate }}</label>
      <select id="languageSelect" [value]="translate.currentLang()" (change)="onLanguageChange($event)">
        @for (lang of supportedLanguages; track lang) {
          <option [value]="lang">{{ ('settings.language.' + lang) | translate }}</option>
        }
      </select>
    </div>
  `,
  styles: [`
    .setting-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
    }
  `]
})
export class SettingsComponent {
  protected readonly translate = inject(TranslateService);
  readonly supportedLanguages = SUPPORTED_LANGUAGES;

  onLanguageChange(event: Event): void {
    const lang = (event.target as HTMLSelectElement).value as SupportedLanguage;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    this.translate.use(lang).subscribe();
  }
}

