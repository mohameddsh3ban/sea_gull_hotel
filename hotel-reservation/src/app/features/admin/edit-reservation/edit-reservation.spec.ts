import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditReservation } from './edit-reservation';

describe('EditReservation', () => {
  let component: EditReservation;
  let fixture: ComponentFixture<EditReservation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditReservation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditReservation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
