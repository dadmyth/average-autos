import {
  createPurchase,
  getPurchaseByCarId,
  deletePurchase
} from '../models/Purchase.js';

export const addPurchase = async (req, res, next) => {
  try {
    const purchase = await createPurchase(req.body);

    res.status(201).json({
      success: true,
      data: purchase,
      message: 'Purchase agreement created successfully'
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        error: 'A purchase agreement already exists for this car'
      });
    }
    next(error);
  }
};

export const getPurchase = async (req, res, next) => {
  try {
    const { carId } = req.params;
    const purchase = await getPurchaseByCarId(carId);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: 'No purchase record found for this car'
      });
    }

    res.json({
      success: true,
      data: purchase
    });
  } catch (error) {
    next(error);
  }
};

export const removePurchase = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deletePurchase(id);

    res.json({
      success: true,
      message: 'Purchase record deleted successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
};

export default {
  addPurchase,
  getPurchase,
  removePurchase
};
