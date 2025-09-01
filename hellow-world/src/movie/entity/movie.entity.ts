import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
import { UpdateMovieDto } from '../dto/update-movie.dto';

// 모든 클래스에 공통으로 쓰일만한 메타정보들을 따로 클래스로 빼고 상속
export class BaseEntity{
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
  
// Entity를 달아야 테이블이 생성되고 
// app.module.ts의 entity에 등록해야함
// @Entity()를 달아야 테이블로 관리하는게 된다.
// 이 Entity는 후에 typeorm의 Repository로 접근 가능
@Entity()
//@Exclude()
export class Movie extends BaseEntity{
  @PrimaryGeneratedColumn()
  //@Expose()
  id: number;

  @Column()
  //@Expose()
  title: string;

  @Column()
  //@Expose()
  genre: string;
}
