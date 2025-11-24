import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadGuestList } from './upload-guest-list';

describe('UploadGuestList', () => {
  let component: UploadGuestList;
  let fixture: ComponentFixture<UploadGuestList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadGuestList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadGuestList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
