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
    MatSliderThumb
  ],
  templateUrl: './create-dialog.component.html'
})
export class CreateDialogComponent {
  readonly dialogRef = inject(MatDialogRef<CreateDialogComponent>);
  data = inject(MAT_DIALOG_DATA);
  temperature = 0;
  width = 5;
  height = 5;

  onNoClick(): void {
    this.dialogRef.close();
  }
}
