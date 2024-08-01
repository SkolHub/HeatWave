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
    MatLabel
  ],
  templateUrl: './create-dialog.component.html'
})
export class CreateDialogComponent {
  readonly dialogRef = inject(MatDialogRef<CreateDialogComponent>);
  readonly data = inject(MAT_DIALOG_DATA);
  readonly temperature = (this.data.animal);
  readonly width = (this.data.animal);
  readonly height = (this.data.animal);

  onNoClick(): void {
    this.dialogRef.close();
  }
}
