import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageCapacities } from './manage-capacities';

describe('ManageCapacities', () => {
  let component: ManageCapacities;
  let fixture: ComponentFixture<ManageCapacities>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageCapacities]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageCapacities);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
