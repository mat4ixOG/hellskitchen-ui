import { Component } from '@angular/core';
import { HeroComponent } from '../sections/hero/hero.component';
import { MarqueeComponent } from '../sections/marquee/marquee.component';
import { FeaturesComponent } from '../sections/features/features.component';
import { ShowcaseComponent } from '../sections/showcase/showcase.component';
// import { MotionComponent } from '../sections/motion/motion.component';
import { ThemingComponent } from '../sections/theming/theming.component';
import { StatsComponent } from '../sections/stats/stats.component';
import { CtaComponent } from '../sections/cta/cta.component';

@Component({
  selector: 'app-home',
  imports: [
    HeroComponent,
    MarqueeComponent,
    FeaturesComponent,
    ShowcaseComponent,
    // MotionComponent,
    ThemingComponent,
    StatsComponent,
    CtaComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {}
