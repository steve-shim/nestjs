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
  ) {
    console.log(req.user);
    // if (!title) {
    //   return this.movies;
    // }
    // //return this.movies.filter((m) => m.title === title);
    // return this.movies.filter((m) => m.title.startsWith(title));
    return this.movieService.findAll(dto);
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
  @UseInterceptors(FileFieldsInterceptor([
    {
      name: 'movie',
      maxCount: 1,
    },
    {
      name: 'poster',
      maxCount: 2,
    }
  ], {
    limits: {
      fileSize: 20000000 // 20 MB
    },
    fileFilter(req, file, callback) {
      console.log(file);
      if(file.mimetype === 'video/mp4' || file.mimetype === 'image/jpeg') {
        return callback(
          new BadRequestException('MP4 타입만 업로드 가능합니다!'),
          false // 에러가 나면 파일을 받지 않겠다
        )
      }

      return callback(null, true); // 에러가 없으면 파일을 받겠다
    }
  }))
  postMovie(
    @Body() body: CreateMovieDto,
    @Request() req,
    @UploadedFiles() files: {
      movies?: Express.Multer.File[],
      poster?: Express.Multer.File[]
    }
  ) {
    console.log("--------------")
    console.log("files", files)

    return this.movieService.create(
      body,
      req.queryRunner
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
}
