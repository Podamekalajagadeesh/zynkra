
import { Router } from 'express';
import { AdsManagerController } from '../ads-manager.controller';

const router = Router();
const adsManagerController = new AdsManagerController();

// Campaign routes
router.get('/campaigns', (req, res) => adsManagerController.getCampaigns(req, res));
router.get('/campaigns/:campaignId', (req, res) => adsManagerController.getCampaignById(req, res));
router.post('/campaigns', (req, res) => adsManagerController.createCampaign(req, res));
router.put('/campaigns/:campaignId', (req, res) => adsManagerController.updateCampaign(req, res));
router.delete('/campaigns/:campaignId', (req, res) => adsManagerController.deleteCampaign(req, res));
router.get('/campaigns/:campaignId/performance', (req, res) => adsManagerController.getCampaignPerformance(req, res));

// Ad Set routes
router.get('/campaigns/:campaignId/adsets', (req, res) => adsManagerController.getAdSets(req, res));
router.get('/adsets/:adSetId', (req, res) => adsManagerController.getAdSetById(req, res));
router.post('/campaigns/:campaignId/adsets', (req, res) => adsManagerController.createAdSet(req, res));
router.put('/adsets/:adSetId', (req, res) => adsManagerController.updateAdSet(req, res));
router.delete('/adsets/:adSetId', (req, res) => adsManagerController.deleteAdSet(req, res));

// Ad routes
router.get('/adsets/:adSetId/ads', (req, res) => adsManagerController.getAds(req, res));
router.get('/ads/:adId', (req, res) => adsManagerController.getAdById(req, res));
router.post('/adsets/:adSetId/ads', (req, res) => adsManagerController.createAd(req, res));
router.put('/ads/:adId', (req, res) => adsManagerController.updateAd(req, res));
router.delete('/ads/:adId', (req, res) => adsManagerController.deleteAd(req, res));

// Tracking routes
router.post('/ads/:adId/track-impression', (req, res) => adsManagerController.trackImpression(req, res));
router.post('/ads/:adId/track-click', (req, res) => adsManagerController.trackClick(req, res));
router.post('/ads/:adId/track-conversion', (req, res) => adsManagerController.trackConversion(req, res));

// Legacy routes for backward compatibility
router.get('/adsets/:campaignId', (req, res) => adsManagerController.getAdSets(req, res));
router.get('/ads/:adSetId', (req, res) => adsManagerController.getAds(req, res));

export default router;