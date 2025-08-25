import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMatterDto, UpdateMatterDto } from './dto';

@Injectable()
export class MattersService {
  constructor(private prisma: PrismaService) {}

  async create(createMatterDto: CreateMatterDto) {
    return this.prisma.matter.create({
      data: createMatterDto,
      include: {
        org: true,
        user: true,
        agreements: true,
      },
    });
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, orgId, ...filters } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...filters,
      ...(orgId && { orgId }),
    };

    const [matters, total] = await Promise.all([
      this.prisma.matter.findMany({
        where,
        skip,
        take: limit,
        include: {
          org: true,
          user: true,
          agreements: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.matter.count({ where }),
    ]);

    return {
      data: matters,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const matter = await this.prisma.matter.findUnique({
      where: { id },
      include: {
        org: true,
        user: true,
        agreements: {
          include: {
            files: true,
            versions: true,
          },
        },
        threads: true,
      },
    });

    if (!matter) {
      throw new NotFoundException(`Matter with ID ${id} not found`);
    }

    return matter;
  }

  async update(id: string, updateMatterDto: UpdateMatterDto) {
    await this.findOne(id);

    return this.prisma.matter.update({
      where: { id },
      data: updateMatterDto,
      include: {
        org: true,
        user: true,
        agreements: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.matter.delete({
      where: { id },
    });
  }
}
