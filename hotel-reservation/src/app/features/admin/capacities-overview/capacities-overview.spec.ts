import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CapacitiesOverview } from './capacities-overview';

describe('CapacitiesOverview', () => {
  let component: CapacitiesOverview;
  let fixture: ComponentFixture<CapacitiesOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CapacitiesOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CapacitiesOverview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
