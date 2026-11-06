import { Component, computed, input, signal } from '@angular/core';
import { EventReviewerPreview } from '../../models/event-review.model';
import { resolveAssetUrl } from '../../utils/asset-url.util';

@Component({
  selector: 'app-event-rating',
  standalone: true,
  templateUrl: './event-rating.component.html',
  styleUrl: './event-rating.component.css',
})
export class EventRatingComponent {
  readonly averageRating = input<number | null | undefined>(null);
  readonly reviewCount = input<number | undefined>(0);
  readonly reviewers = input<EventReviewerPreview[] | undefined>([]);
  readonly failedPhotos = signal(new Set<string>());
  readonly authors = computed(() => (this.reviewers() ?? []).slice(0, 4));
  readonly remaining = computed(() => Math.max(0, (this.reviewCount() ?? 0) - this.authors().length));
  readonly average = computed(() => {
    const rating = this.averageRating();
    return rating == null ? '' : new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 1, maximumFractionDigits: 2,
    }).format(rating);
  });

  photo(author: EventReviewerPreview): string {
    return resolveAssetUrl(author.avatarUrl);
  }

  initials(name: string): string {
    return name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || 'U';
  }

  markPhotoFailed(url: string): void {
    this.failedPhotos.update(current => new Set([...current, url]));
  }
}
