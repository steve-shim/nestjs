import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  BadRequestException,
  DefaultValuePipe,
  Request,
  UseGuards,
  UploadedFile,
  UploadedFiles
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rabc.decorator';
import { Role } from 'src/user/entities/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';
import { TransactionInterceptor } from 'src/common/interceptor/tansaction.interceptor';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MovieFilePipe } from './pipe/movie-file.pipe';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { QueryRunner as QR } from 'typeorm';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor) // ClassTransformer를 MovieController에 적용하겠다
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @Public()
  //@UseInterceptors(CacheInterceptor) // 매서드나 클래스에 적용
  getMovies(
    @Request() req: any,
    @Query() dto: GetMoviesDto,
    @UserId() userId?: number,
  ) {
    console.log(req.user);
    // if (!title) {
    //   return this.movies;
    // }
    // //return this.movies.filter((m) => m.title === title);
    // return this.movies.filter((m) => m.title.startsWith(title));
    return this.movieService.findAll(dto, userId);
  }

  @Get(':id')
  @Public()
  getMovie(
    @Param('id', ParseIntPipe) id: number,
    @Query('test', new DefaultValuePipe(10)) test: number
  ) {
    // console.log(typeof id) -> ParseIntPipe을 적용했기 때문에 number 변환되어 들어옴
    // +id -> string을 number로 바꿔서 인자로 넘김
    return this.movieService.findOne(id);
  }

  @Post()
  @RBAC(Role.admin)
  @UseGuards(AuthGuard) // access 토큰이 헤더에 존재하지 않으면 Guards에서 403 Forbidden resource 발생시킴 
  @UseInterceptors(TransactionInterceptor)
  postMovie(
    @Body() body: CreateMovieDto,
    //@Request() req,
    @QueryRunner() queryRunner: QR,
    @UserId() userId: number
  ) {
    console.log("--------------")
  
    /// bearer-token.middleware에서 
    /// req.user = payload 넣었기 때문에 req를 통해서 유저정보 받기 가능
    return this.movieService.create(
      body,
      userId,
      queryRunner
    );
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(@Param('id', ParseIntPipe) id: string, @Body() body: UpdateMovieDto) {
    return this.movieService.update(+id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(@Param('id', ParseIntPipe) id: string) {
    return this.movieService.remove(+id);
  }

  /**
   * [Like]  [Dislike]
   * 
   * 아무것도 누르지 않은 상태: 모두 버튼 꺼져있음
   */
  @Post(':id/like')
  createMovieLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ){
    return this.movieService.toggleMovieLike(movieId, userId, true)
  }

  @Post(':id/dislike')
  createMovieDislike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ){
    return this.movieService.toggleMovieLike(movieId, userId, false)
  }
}
