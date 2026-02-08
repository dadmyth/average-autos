import { dbAll, dbGet } from '../config/database.js';
import { getTotalCosts } from '../models/Car.js';

export const getStatistics = async (req, res, next) => {
  try {
    // Get total cars count
    const totalCarsResult = await dbGet('SELECT COUNT(*) as count FROM cars');
    const totalCars = totalCarsResult.count;

    // Get active cars count
    const activeCarsResult = await dbGet("SELECT COUNT(*) as count FROM cars WHERE status = 'active'");
    const activeCars = activeCarsResult.count;

    // Get sold cars count
    const soldCarsResult = await dbGet("SELECT COUNT(*) as count FROM cars WHERE status = 'sold'");
    const soldCars = soldCarsResult.count;

    // Get total revenue from sales
    const revenueResult = await dbGet('SELECT COALESCE(SUM(sale_price), 0) as total FROM sales');
    const totalRevenue = parseFloat(revenueResult.total);

    // Get total costs (purchase prices + services)
    const purchaseCostsResult = await dbGet('SELECT COALESCE(SUM(purchase_price), 0) as total FROM cars');
    const totalPurchaseCosts = parseFloat(purchaseCostsResult.total);

    const serviceCostsResult = await dbGet('SELECT COALESCE(SUM(cost), 0) as total FROM service_records');
    const totalServiceCosts = parseFloat(serviceCostsResult.total);

    const totalCosts = totalPurchaseCosts + totalServiceCosts;

    // Calculate profit (only for sold cars)
    const soldCarIds = await dbAll("SELECT id FROM cars WHERE status = 'sold'");
    let totalProfit = 0;

    for (const car of soldCarIds) {
      const costs = await getTotalCosts(car.id);
      const sale = await dbGet('SELECT sale_price FROM sales WHERE car_id = ?', [car.id]);
      if (sale) {
        totalProfit += parseFloat(sale.sale_price) - costs.total_cost;
      }
    }

    // Get average profit per sale
    const averageProfit = soldCars > 0 ? totalProfit / soldCars : 0;

    res.json({
      success: true,
      data: {
        total_cars: totalCars,
        active_cars: activeCars,
        sold_cars: soldCars,
        total_revenue: totalRevenue,
        total_costs: totalCosts,
        total_profit: totalProfit,
        average_profit: averageProfit
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProfitLoss = async (req, res, next) => {
  try {
    // Get all sold cars with their profit/loss
    const soldCars = await dbAll(`
      SELECT c.id, c.registration_plate, c.make, c.model, c.year,
             c.purchase_price, s.sale_price, s.sale_date
      FROM cars c
      JOIN sales s ON c.id = s.car_id
      WHERE c.status = 'sold'
      ORDER BY s.sale_date DESC
    `);

    const profitLossData = await Promise.all(
      soldCars.map(async (car) => {
        const costs = await getTotalCosts(car.id);
        const profit = parseFloat(car.sale_price) - costs.total_cost;

        return {
          car_id: car.id,
          registration_plate: car.registration_plate,
          make: car.make,
          model: car.model,
          year: car.year,
          sale_date: car.sale_date,
          purchase_price: parseFloat(car.purchase_price),
          service_costs: costs.total_service_cost,
          total_cost: costs.total_cost,
          sale_price: parseFloat(car.sale_price),
          profit: profit
        };
      })
    );

    res.json({
      success: true,
      data: profitLossData
    });
  } catch (error) {
    next(error);
  }
};

export const getExpiryAlerts = async (req, res, next) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const todayStr = today.toISOString().split('T')[0];
    const futureStr = thirtyDaysFromNow.toISOString().split('T')[0];

    // Get cars with expiring WOF or Registration
    const expiringCars = await dbAll(`
      SELECT id, registration_plate, make, model, year, registration_expiry, wof_expiry
      FROM cars
      WHERE status = 'active'
        AND (
          (registration_expiry BETWEEN ? AND ?)
          OR (wof_expiry BETWEEN ? AND ?)
          OR registration_expiry < ?
          OR wof_expiry < ?
        )
      ORDER BY registration_expiry ASC, wof_expiry ASC
    `, [todayStr, futureStr, todayStr, futureStr, todayStr, todayStr]);

    const alerts = expiringCars.map(car => {
      const regExpiry = new Date(car.registration_expiry);
      const wofExpiry = new Date(car.wof_expiry);

      const regDaysUntilExpiry = Math.ceil((regExpiry - today) / (1000 * 60 * 60 * 24));
      const wofDaysUntilExpiry = Math.ceil((wofExpiry - today) / (1000 * 60 * 60 * 24));

      return {
        ...car,
        reg_status: regDaysUntilExpiry < 0 ? 'expired' : regDaysUntilExpiry <= 30 ? 'expiring_soon' : 'valid',
        wof_status: wofDaysUntilExpiry < 0 ? 'expired' : wofDaysUntilExpiry <= 30 ? 'expiring_soon' : 'valid',
        reg_days_until_expiry: regDaysUntilExpiry,
        wof_days_until_expiry: wofDaysUntilExpiry
      };
    });

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    next(error);
  }
};

export const getAgingStock = async (req, res, next) => {
  try {
    const today = new Date();
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split('T')[0];

    const agingCars = await dbAll(`
      SELECT id, registration_plate, make, model, year, purchase_date, purchase_price
      FROM cars
      WHERE status = 'active'
        AND purchase_date <= ?
      ORDER BY purchase_date ASC
    `, [sixtyDaysAgoStr]);

    const result = agingCars.map(car => {
      const purchaseDate = new Date(car.purchase_date);
      const daysInStock = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
      return { ...car, days_in_stock: daysInStock };
    });

    res.json({
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlySales = async (req, res, next) => {
  try {
    // Get sales grouped by month for the last 12 months
    const monthlySales = await dbAll(`
      SELECT
        strftime('%Y-%m', sale_date) as month,
        COUNT(*) as count,
        SUM(sale_price) as revenue
      FROM sales
      WHERE sale_date >= date('now', '-12 months')
      GROUP BY month
      ORDER BY month DESC
    `);

    res.json({
      success: true,
      data: monthlySales
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getStatistics,
  getProfitLoss,
  getExpiryAlerts,
  getAgingStock,
  getMonthlySales
};
