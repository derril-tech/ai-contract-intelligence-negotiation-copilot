import { Router } from 'express';
import { MattersController } from '../../modules/matters/matters.controller';
import { AgreementsController } from '../../modules/agreements/agreements.controller';
import { LibraryController } from '../../modules/library/library.controller';
import { RedlineController } from '../../modules/redline/redline.controller';
import { RiskController } from '../../modules/risk/risk.controller';
import { CommentsController } from '../../modules/comments/comments.controller';
import { ApprovalsController } from '../../modules/approvals/approvals.controller';
import { EmailController } from '../../modules/email/email.controller';
import { SignatureController } from '../../modules/signature/signature.controller';
import { ObligationsController } from '../../modules/obligations/obligations.controller';
import { ExportsController } from '../../modules/exports/exports.controller';

export const api_router = Router();

// Health checks
api_router.get('/health', (req, res) => res.json({ status: 'ok' }));

// API routes
api_router.use('/matters', MattersController);
api_router.use('/agreements', AgreementsController);
api_router.use('/library', LibraryController);
api_router.use('/redline', RedlineController);
api_router.use('/risk', RiskController);
api_router.use('/comments', CommentsController);
api_router.use('/approvals', ApprovalsController);
api_router.use('/email', EmailController);
api_router.use('/signature', SignatureController);
api_router.use('/obligations', ObligationsController);
api_router.use('/exports', ExportsController);
