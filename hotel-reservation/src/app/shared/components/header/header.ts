import { Component, signal, OnInit, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      [class]="headerClasses()"
      class="fixed inset-x-0 top-0 z-50 transition-all duration-300"
    >
      <div class="relative w-full max-w-6xl mx-auto flex items-center justify-between">
        <div class="hidden md:flex items-center">
          <span [class]="titleClasses()" class="tracking-wide cursor-pointer" (click)="navigate('/')">
            {{ 'hotelName' | translate }}
          </span>
        </div>
        <div [class]="logoContainerClasses()" class="absolute inset-x-0 flex justify-center pointer-events-none">
          <img [src]="logoSrc()" alt="Hotel Logo" [class]="logoClasses()" class="w-auto transform pointer-events-auto cursor-pointer drop-shadow-md" (click)="navigate('/')" />
        </div>
        <div [class]="navContainerClasses()" class="hidden md:flex items-center">
          <nav [class]="navClasses()" class="flex items-center">
            <span [class]="linkClasses()" (click)="navigate('/')">{{ 'home' | translate }}</span>
            <span [class]="linkClasses()" (click)="navigate('/about')">{{ 'about' | translate }}</span>
            <span [class]="linkClasses()" (click)="navigate('/contact')">{{ 'contact' | translate }}</span>
          </nav>
          <select [value]="currentLanguage()" (change)="changeLanguage($event)" [class]="selectClasses()" class="min-w-[92px]">
            <option value="en">🇺🇸 English</option>
            <option value="de">🇩🇪 Deutsch</option>
            <option value="ru">🇷🇺 Русский</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="cs">🇨🇿 Čeština</option>
            <option value="sr">🇷🇸 Srpski</option>
            <option value="pl">🇵🇱 Polski</option>
          </select>
        </div>
        <div [class]="mobileIconClasses()" class="flex md:hidden ml-auto">
          <button (click)="toggleMobileMenu()" class="focus:outline-none">
            @if (isOpen()) {
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            }
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [],
})
export class Header implements OnInit {
  isOpen = signal(false);
  isScrolled = signal(false);
  isHome = signal(true);
  currentLanguage = signal('en');

  constructor(private router: Router, private translate: TranslateService) {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.isOpen.set(false);
        this.updateIsHome();
      });

    this.currentLanguage.set(this.translate.currentLang || 'en');
  }

  ngOnInit() {
    this.updateIsHome();
    this.checkScroll();
  }

  @HostListener('window:scroll')
  onScroll() {
    this.checkScroll();
  }

  private checkScroll() {
    if (!this.isHome()) {
      this.isScrolled.set(true);
      return;
    }
    this.isScrolled.set(window.scrollY > 0);
  }

  private updateIsHome() {
    this.isHome.set(this.router.url === '/');
  }

  effectiveScrolled = () => !this.isHome() || this.isScrolled();
  compact = () => !this.effectiveScrolled();
  logoSrc = () => (this.effectiveScrolled() ? 'assets/images/seagullwhite.png' : 'assets/images/logo.png');

  headerClasses = () => `${this.effectiveScrolled() ? 'bg-[#253645]/95 text-white shadow-lg backdrop-blur' : 'bg-transparent text-slate-900'} ${this.compact() ? 'px-2 sm:px-3 py-1 translate-y-10 sm:translate-y-12 md:translate-y-14' : 'px-6 py-5 translate-y-0'}`;
  titleClasses = () => `${this.compact() ? 'text-lg' : 'text-base sm:text-lg'} ${this.effectiveScrolled() ? 'text-white/95 hover:opacity-90' : 'text-slate-900 hover:opacity-80'}`;
  logoContainerClasses = () => (this.compact() ? 'translate-y-2 sm:translate-y-3' : '');
  logoClasses = () => this.compact() ? 'h-14 sm:h-16 -translate-y-1 sm:-translate-y-2' : 'h-12 sm:h-14';
  navContainerClasses = () => (this.compact() ? 'gap-3' : 'gap-8');
  navClasses = () => `${this.compact() ? 'gap-3' : 'gap-5'} ${this.compact() ? 'text-base' : 'text-sm'}`;
  linkClasses = () => `cursor-pointer transition font-medium ${this.effectiveScrolled() ? 'text-white/95 hover:text-white' : 'text-slate-900 hover:text-slate-700'}`;
  selectClasses = () => `${this.effectiveScrolled() ? 'bg-white/15 text-white border border-white/30 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 rounded text-sm backdrop-blur transition' : 'bg-white/90 text-slate-900 border border-slate-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 rounded text-sm transition'} ${this.compact() ? 'px-2 py-0.5' : 'px-2 py-1'}`;
  mobileIconClasses = () => `${this.effectiveScrolled() ? 'text-white' : 'text-slate-900'} ${this.compact() ? 'translate-y-1' : ''}`;
  
  navigate(path: string) { this.router.navigate([path]); }
  toggleMobileMenu() { this.isOpen.update((v) => !v); }
  changeLanguage(event: Event) {
    const lang = (event.target as HTMLSelectElement).value;
    this.translate.use(lang);
    this.currentLanguage.set(lang);
  }
}
