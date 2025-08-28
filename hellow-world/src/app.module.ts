import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MovieModule } from './movie/movie.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5555,
      username: 'postgres',
      password: '1234',
      database: 'postgres',
      entities: [],
      synchronize: true,
    }),
    MovieModule,
  ],
  // controllers: [AppController],
  // providers: [AppService],
})
export class AppModule {}
