import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { CurrentMerchant } from '../../common/decorators/merchant.decorator';

@ApiTags('customers')
@Controller('customers')
@UseGuards(ApiKeyGuard)
@ApiBearerAuth('api-key')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Post() @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a customer' })
  async create(@CurrentMerchant() m: { id: string }, @Body() dto: CreateCustomerDto) {
    return this.service.create(m.id, dto);
  }

  @Get() @ApiOperation({ summary: 'List customers' })
  async findAll(
    @CurrentMerchant() m: { id: string },
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(m.id, { skip: skip ? +skip : 0, take: take ? +take : 20, search });
  }

  @Get(':id') @ApiOperation({ summary: 'Get customer' })
  async findOne(@CurrentMerchant() m: { id: string }, @Param('id') id: string) {
    return this.service.findOne(m.id, id);
  }

  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete customer' })
  async delete(@CurrentMerchant() m: { id: string }, @Param('id') id: string) {
    await this.service.delete(m.id, id);
  }
}
