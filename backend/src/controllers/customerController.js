import {
  getAllCustomers,
  getCustomerById,
  searchCustomers,
  getCustomerPurchases,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from '../models/Customer.js';

// Get all customers
export const getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;

    let customers;
    if (search) {
      customers = await searchCustomers(search);
    } else {
      customers = await getAllCustomers();
    }

    // Get purchase count for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const purchases = await getCustomerPurchases(customer.id);
        return {
          ...customer,
          purchase_count: purchases.length,
          total_spent: purchases.reduce((sum, p) => sum + parseFloat(p.sale_price), 0)
        };
      })
    );

    res.json({
      success: true,
      data: customersWithStats,
      count: customersWithStats.length
    });
  } catch (error) {
    next(error);
  }
};

// Get single customer with purchase history
export const getCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await getCustomerById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const purchases = await getCustomerPurchases(id);

    res.json({
      success: true,
      data: {
        ...customer,
        purchases,
        purchase_count: purchases.length,
        total_spent: purchases.reduce((sum, p) => sum + parseFloat(p.sale_price), 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new customer
export const addCustomer = async (req, res, next) => {
  try {
    const customer = await createCustomer(req.body);

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully'
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        error: 'A customer with this phone number already exists'
      });
    }
    next(error);
  }
};

// Update customer
export const editCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingCustomer = await getCustomerById(id);
    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const updatedCustomer = await updateCustomer(id, req.body);

    res.json({
      success: true,
      data: updatedCustomer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete customer
export const removeCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await getCustomerById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    await deleteCustomer(id);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getCustomers,
  getCustomer,
  addCustomer,
  editCustomer,
  removeCustomer
};
