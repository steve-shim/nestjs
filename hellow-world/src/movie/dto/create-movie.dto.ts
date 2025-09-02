import { ArrayNotEmpty, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { LargeNumberLike } from 'crypto';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  // @IsNotEmpty()
  // genre: string;
 
  @IsNotEmpty()
  @IsString()
  detail: string;

  @IsNotEmpty()
  @IsNumber()
  directorId: number;

  @IsNotEmpty()
  @ArrayNotEmpty()
  @IsNumber({}, {
    each: true,
  })
  genreIds: number[];
}
