// Created automatically by Cursor AI (2024-12-19)

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateThreadDto, CreateCommentDto, UpdateCommentDto } from './dto';
import { CommentThread, Comment, User } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createThread(createThreadDto: CreateThreadDto, authorId: string): Promise<CommentThread> {
    const { agreementId, sectionId, title, content, selection, pageNumber, lineNumber, tags, priority, assigneeIds } = createThreadDto;

    // Verify agreement and section exist
    const agreement = await this.prisma.agreement.findUnique({
      where: { id: agreementId },
      include: { matter: true }
    });

    if (!agreement) {
      throw new NotFoundException('Agreement not found');
    }

    const section = await this.prisma.section.findUnique({
      where: { id: sectionId }
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    // Create thread with initial comment
    const thread = await this.prisma.commentThread.create({
      data: {
        agreementId,
        sectionId,
        title,
        selection,
        pageNumber,
        lineNumber,
        tags: tags || [],
        priority: priority || 'medium',
        status: 'open',
        authorId,
        assignees: assigneeIds ? {
          create: assigneeIds.map(userId => ({
            userId,
            assignedAt: new Date(),
            assignedBy: authorId
          }))
        } : undefined,
        comments: {
          create: {
            content,
            authorId,
            tags: tags || [],
            isInitial: true
          }
        }
      },
      include: {
        author: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        assignees: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true }
            }
          }
        },
        comments: {
          include: {
            author: {
              select: { id: true, email: true, firstName: true, lastName: true }
            },
            mentions: {
              include: {
                user: {
                  select: { id: true, email: true, firstName: true, lastName: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return thread;
  }

  async getThreads(
    agreementId: string,
    sectionId?: string,
    status?: 'open' | 'resolved' | 'all'
  ): Promise<CommentThread[]> {
    const where: any = { agreementId };
    
    if (sectionId) {
      where.sectionId = sectionId;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }

    return this.prisma.commentThread.findMany({
      where,
      include: {
        author: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        assignees: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true }
            }
          }
        },
        comments: {
          include: {
            author: {
              select: { id: true, email: true, firstName: true, lastName: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { comments: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async getThread(threadId: string): Promise<CommentThread> {
    const thread = await this.prisma.commentThread.findUnique({
      where: { id: threadId },
      include: {
        author: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        assignees: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true }
            }
          }
        },
        comments: {
          include: {
            author: {
              select: { id: true, email: true, firstName: true, lastName: true }
            },
            mentions: {
              include: {
                user: {
                  select: { id: true, email: true, firstName: true, lastName: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!thread) {
      throw new NotFoundException('Comment thread not found');
    }

    return thread;
  }

  async addComment(
    threadId: string,
    createCommentDto: CreateCommentDto,
    authorId: string
  ): Promise<Comment> {
    const { content, mentionUserIds, tags, resolvesThread } = createCommentDto;

    // Verify thread exists
    const thread = await this.prisma.commentThread.findUnique({
      where: { id: threadId }
    });

    if (!thread) {
      throw new NotFoundException('Comment thread not found');
    }

    // Create comment with mentions
    const comment = await this.prisma.comment.create({
      data: {
        threadId,
        content,
        authorId,
        tags: tags || [],
        mentions: mentionUserIds ? {
          create: mentionUserIds.map(userId => ({
            userId,
            mentionedAt: new Date()
          }))
        } : undefined
      },
      include: {
        author: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        mentions: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true }
            }
          }
        }
      }
    });

    // Update thread status if comment resolves it
    if (resolvesThread) {
      await this.prisma.commentThread.update({
        where: { id: threadId },
        data: { 
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: authorId
        }
      });
    }

    return comment;
  }

  async resolveThread(threadId: string, userId: string): Promise<CommentThread> {
    const thread = await this.prisma.commentThread.findUnique({
      where: { id: threadId }
    });

    if (!thread) {
      throw new NotFoundException('Comment thread not found');
    }

    return this.prisma.commentThread.update({
      where: { id: threadId },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: userId
      },
      include: {
        author: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        assignees: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true }
            }
          }
        }
      }
    });
  }

  async reopenThread(threadId: string, userId: string): Promise<CommentThread> {
    const thread = await this.prisma.commentThread.findUnique({
      where: { id: threadId }
    });

    if (!thread) {
      throw new NotFoundException('Comment thread not found');
    }

    return this.prisma.commentThread.update({
      where: { id: threadId },
      data: {
        status: 'open',
        resolvedAt: null,
        resolvedBy: null
      },
      include: {
        author: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        assignees: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true }
            }
          }
        }
      }
    });
  }

  async updateComment(
    commentId: string,
    updateCommentDto: UpdateCommentDto,
    userId: string
  ): Promise<Comment> {
    const { content, mentionUserIds, tags } = updateCommentDto;

    // Verify comment exists and user is author
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: true }
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    // Update comment
    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        tags: tags || [],
        updatedAt: new Date()
      },
      include: {
        author: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        mentions: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true }
            }
          }
        }
      }
    });

    // Update mentions if provided
    if (mentionUserIds) {
      // Remove existing mentions
      await this.prisma.commentMention.deleteMany({
        where: { commentId }
      });

      // Add new mentions
      if (mentionUserIds.length > 0) {
        await this.prisma.commentMention.createMany({
          data: mentionUserIds.map(userId => ({
            commentId,
            userId,
            mentionedAt: new Date()
          }))
        });
      }
    }

    return updatedComment;
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: true }
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({
      where: { id: commentId }
    });
  }

  async getCommentSummary(agreementId: string): Promise<any> {
    const threads = await this.prisma.commentThread.findMany({
      where: { agreementId },
      include: {
        _count: {
          select: { comments: true }
        }
      }
    });

    const summary = {
      totalThreads: threads.length,
      openThreads: threads.filter(t => t.status === 'open').length,
      resolvedThreads: threads.filter(t => t.status === 'resolved').length,
      totalComments: threads.reduce((sum, t) => sum + t._count.comments, 0),
      priorityBreakdown: {
        critical: threads.filter(t => t.priority === 'critical').length,
        high: threads.filter(t => t.priority === 'high').length,
        medium: threads.filter(t => t.priority === 'medium').length,
        low: threads.filter(t => t.priority === 'low').length
      },
      recentActivity: threads
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
        .map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          updatedAt: t.updatedAt,
          commentCount: t._count.comments
        }))
    };

    return summary;
  }

  async assignThread(threadId: string, assigneeId: string, assignedBy: string): Promise<CommentThread> {
    const thread = await this.prisma.commentThread.findUnique({
      where: { id: threadId }
    });

    if (!thread) {
      throw new NotFoundException('Comment thread not found');
    }

    // Remove existing assignments
    await this.prisma.threadAssignment.deleteMany({
      where: { threadId }
    });

    // Add new assignment
    await this.prisma.threadAssignment.create({
      data: {
        threadId,
        userId: assigneeId,
        assignedAt: new Date(),
        assignedBy
      }
    });

    return this.getThread(threadId);
  }

  async mentionUsers(threadId: string, userIds: string[], mentionedBy: string): Promise<void> {
    const thread = await this.prisma.commentThread.findUnique({
      where: { id: threadId }
    });

    if (!thread) {
      throw new NotFoundException('Comment thread not found');
    }

    // Add mentions to the thread
    await this.prisma.threadMention.createMany({
      data: userIds.map(userId => ({
        threadId,
        userId,
        mentionedAt: new Date(),
        mentionedBy
      })),
      skipDuplicates: true
    });
  }
}
