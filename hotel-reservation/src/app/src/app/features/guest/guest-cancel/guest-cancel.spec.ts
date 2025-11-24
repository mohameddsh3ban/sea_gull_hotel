import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestCancel } from './guest-cancel';

describe('GuestCancel', () => {
  let component: GuestCancel;
  let fixture: ComponentFixture<GuestCancel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestCancel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuestCancel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
