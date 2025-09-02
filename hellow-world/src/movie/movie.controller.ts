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
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor) // ClassTransformer를 MovieController에 적용하겠다
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  getMovies(@Query('title') title?: string) {
    // if (!title) {
    //   return this.movies;
    // }
    // //return this.movies.filter((m) => m.title === title);
    // return this.movies.filter((m) => m.title.startsWith(title));
    return this.movieService.findAll(title);
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    // +id -> string을 number로 바꿔서 인자로 넘김
    return this.movieService.findOne(+id);
  }

  @Post()
  postMovie(@Body() body: CreateMovieDto) {
    return this.movieService.create(body);
  }

  @Patch(':id')
  patchMovie(@Param('id') id: string, @Body() body: UpdateMovieDto) {
    return this.movieService.update(+id, body);
  }

  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    return this.movieService.remove(+id);
  }
}
