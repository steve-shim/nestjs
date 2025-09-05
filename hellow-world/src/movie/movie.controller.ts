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
  UseGuards
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';
import { AuthGuard } from 'src/auth/guard/auth.guard';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor) // ClassTransformer를 MovieController에 적용하겠다
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  getMovies(
    @Request() req: any,
    @Query('title', MovieTitleValidationPipe) title?: string
  ) {
    console.log(req.user);
    // if (!title) {
    //   return this.movies;
    // }
    // //return this.movies.filter((m) => m.title === title);
    // return this.movies.filter((m) => m.title.startsWith(title));
    return this.movieService.findAll(title);
  }

  @Get(':id')
  getMovie(
    @Param('id', ParseIntPipe) id: number,
    @Query('test', new DefaultValuePipe(10)) test: number
  ) {
    // console.log(typeof id) -> ParseIntPipe을 적용했기 때문에 number 변환되어 들어옴
    // +id -> string을 number로 바꿔서 인자로 넘김
    return this.movieService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard) // access 토큰이 헤더에 존재하지 않으면 Guards에서 403 Forbidden resource 발생시킴 
  postMovie(@Body() body: CreateMovieDto) {
    return this.movieService.create(body);
  }

  @Patch(':id')
  patchMovie(@Param('id', ParseIntPipe) id: string, @Body() body: UpdateMovieDto) {
    return this.movieService.update(+id, body);
  }

  @Delete(':id')
  deleteMovie(@Param('id', ParseIntPipe) id: string) {
    return this.movieService.remove(+id);
  }
}
