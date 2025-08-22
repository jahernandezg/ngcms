import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SiteSettingsService } from './shared/site-settings.service';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  standalone : true,
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected title = 'frontend';
  private siteSettings = inject(SiteSettingsService);
  ngOnInit() {
    this.siteSettings.load();
  }
}
