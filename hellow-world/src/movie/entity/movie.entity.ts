import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
import { UpdateMovieDto } from '../dto/update-movie.dto';

// Entity를 달아야 테이블이 생성되고 
// app.module.ts의 entity에 등록해야함
@Entity()
@Exclude()
export class Movie {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  @Column()
  @Expose()
  title: string;

  @Column()
  @Expose()
  genre: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
