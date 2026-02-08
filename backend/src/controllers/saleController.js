import {
  createSale,
  getSaleById,
  getSaleByCarId,
  getAllSales,
  updateSale,
  deleteSale
} from '../models/Sale.js';
import { getTotalCosts } from '../models/Car.js';

export const getSales = async (req, res, next) => {
  try {
    const sales = await getAllSales();

    // Calculate profit for each sale
    const salesWithProfit = await Promise.all(
      sales.map(async (sale) => {
        const costs = await getTotalCosts(sale.car_id);
        const profit = sale.sale_price - costs.total_cost;

        return {
          ...sale,
          total_cost: costs.total_cost,
          profit
        };
      })
    );

    res.json({
      success: true,
      data: salesWithProfit,
      count: salesWithProfit.length
    });
  } catch (error) {
    next(error);
  }
};

export const getSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sale = await getSaleById(id);

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'Sale not found'
      });
    }

    // Calculate profit
    const costs = await getTotalCosts(sale.car_id);
    const profit = sale.sale_price - costs.total_cost;

    res.json({
      success: true,
      data: {
        ...sale,
        total_cost: costs.total_cost,
        profit
      }
    });
  } catch (error) {
    next(error);
  }
};

export const addSale = async (req, res, next) => {
  try {
    const sale = await createSale(req.body);

    res.status(201).json({
      success: true,
      data: sale,
      message: 'Car marked as sold successfully'
    });
  } catch (error) {
    if (error.message.includes('Car not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    if (error.message.includes('already sold')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        error: 'This car already has a sale record'
      });
    }
    next(error);
  }
};

export const editSale = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingSale = await getSaleById(id);
    if (!existingSale) {
      return res.status(404).json({
        success: false,
        error: 'Sale not found'
      });
    }

    const updatedSale = await updateSale(id, req.body);

    res.json({
      success: true,
      data: updatedSale,
      message: 'Sale updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getSaleByCarIdController = async (req, res, next) => {
  try {
    const { carId } = req.params;
    const sale = await getSaleByCarId(carId);

    if (!sale) {
      return res.status(404).json({
        success: false,
        error: 'No sale found for this car'
      });
    }

    // Calculate profit
    const costs = await getTotalCosts(sale.car_id);
    const profit = sale.sale_price - costs.total_cost;

    res.json({
      success: true,
      data: {
        ...sale,
        total_cost: costs.total_cost,
        profit
      }
    });
  } catch (error) {
    next(error);
  }
};

export const removeSale = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingSale = await getSaleById(id);
    if (!existingSale) {
      return res.status(404).json({
        success: false,
        error: 'Sale not found'
      });
    }

    await deleteSale(id);

    res.json({
      success: true,
      message: 'Sale cancelled and car returned to active inventory'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getSales,
  getSale,
  addSale,
  editSale,
  getSaleByCarIdController,
  removeSale
};
