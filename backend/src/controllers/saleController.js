import {
  createSale,
  getSaleById,
  getSaleByCarId,
  getAllSales,
  updateSale,
  deleteSale
} from '../models/Sale.js';
import { getTotalCosts } from '../models/Car.js';
import { dbGet, dbAll } from '../config/database.js';

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
          purchase_price: costs.purchase_price,
          service_cost: costs.total_service_cost,
          wof_fee: costs.wof_fee,
          min_margin: costs.min_margin,
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

export const exportSalesCSV = async (req, res, next) => {
  try {
    const sales = await getAllSales();

    // Calculate profit for each sale
    const salesWithDetails = await Promise.all(
      sales.map(async (sale) => {
        const costs = await getTotalCosts(sale.car_id);
        const profit = sale.sale_price - costs.total_cost;

        // Get car details
        const car = await dbGet('SELECT make, model, year, registration_plate FROM cars WHERE id = ?', [sale.car_id]);

        return {
          ...sale,
          make: car?.make || '',
          model: car?.model || '',
          year: car?.year || '',
          registration_plate: car?.registration_plate || '',
          total_cost: costs.total_cost,
          service_cost: costs.total_service_cost,
          profit
        };
      })
    );

    // Generate CSV
    const headers = [
      'Sale Date',
      'Registration',
      'Make',
      'Model',
      'Year',
      'Customer Name',
      'Customer Phone',
      'Customer Email',
      'Sale Price',
      'Purchase Price',
      'Service Costs',
      'Total Cost',
      'Profit',
      'Payment Method',
      'Payment Status'
    ];

    const rows = salesWithDetails.map(sale => [
      sale.sale_date,
      sale.registration_plate,
      sale.make,
      sale.model,
      sale.year,
      sale.customer_name,
      sale.customer_phone,
      sale.customer_email || '',
      sale.sale_price.toFixed(2),
      sale.total_cost.toFixed(2),
      sale.service_cost.toFixed(2),
      (sale.total_cost + sale.service_cost).toFixed(2),
      sale.profit.toFixed(2),
      sale.payment_method,
      sale.payment_status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sales-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

export const searchSalesByCustomer = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }

    const searchTerm = `%${query.trim()}%`;

    // Search by customer name or phone
    const sales = await dbAll(`
      SELECT s.*, c.make, c.model, c.year, c.registration_plate
      FROM sales s
      JOIN cars c ON s.car_id = c.id
      WHERE s.customer_name LIKE ?
         OR s.customer_phone LIKE ?
         OR s.customer_email LIKE ?
      ORDER BY s.sale_date DESC
    `, [searchTerm, searchTerm, searchTerm]);

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

export default {
  getSales,
  getSale,
  addSale,
  editSale,
  getSaleByCarIdController,
  removeSale,
  exportSalesCSV,
  searchSalesByCustomer
};
