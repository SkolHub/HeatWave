import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { NgForOf, NgStyle } from '@angular/common';

@Component({
  selector: 'app-create-dialog',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatFormField,
    MatInput,
    FormsModule,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    MatLabel,
    MatSlider,
    MatSliderThumb,
    NgForOf,
    NgStyle
  ],
  templateUrl: './create-dialog.component.html'
})
export class CreateDialogComponent {
  readonly dialogRef = inject(MatDialogRef<CreateDialogComponent>);
  data = inject(MAT_DIALOG_DATA);
  temperature = this.data.temperature;
  width = this.data.width;
  height = this.data.height;
  element = this.data.element;

  onNoClick(): void {
    this.dialogRef.close();
  }
}
