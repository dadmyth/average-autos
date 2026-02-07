import {
  createServiceRecord,
  getServiceRecordById,
  getServiceRecordsByCarId,
  updateServiceRecord,
  deleteServiceRecord
} from '../models/ServiceRecord.js';
import { getCarById } from '../models/Car.js';

export const addServiceRecord = async (req, res, next) => {
  try {
    const { id: carId } = req.params;

    // Verify car exists
    const car = await getCarById(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }

    const serviceData = {
      ...req.body,
      car_id: carId
    };

    const service = await createServiceRecord(serviceData);

    res.status(201).json({
      success: true,
      data: service,
      message: 'Service record added successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getCarServices = async (req, res, next) => {
  try {
    const { id: carId } = req.params;

    // Verify car exists
    const car = await getCarById(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        error: 'Car not found'
      });
    }

    const services = await getServiceRecordsByCarId(carId);

    res.json({
      success: true,
      data: services,
      count: services.length
    });
  } catch (error) {
    next(error);
  }
};

export const editServiceRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingService = await getServiceRecordById(id);
    if (!existingService) {
      return res.status(404).json({
        success: false,
        error: 'Service record not found'
      });
    }

    const updatedService = await updateServiceRecord(id, req.body);

    res.json({
      success: true,
      data: updatedService,
      message: 'Service record updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const removeServiceRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await getServiceRecordById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service record not found'
      });
    }

    await deleteServiceRecord(id);

    res.json({
      success: true,
      message: 'Service record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  addServiceRecord,
  getCarServices,
  editServiceRecord,
  removeServiceRecord
};
