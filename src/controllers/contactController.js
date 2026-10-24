import { asyncHandler } from "../utils/asyncHandler.js";
import { ContactMessage } from "../models/ContactMessage.js";
import { ApiError } from "../utils/ApiError.js";
import { getDbConnectionStatus } from "../config/database.js";
import { memoryStore } from "../services/memoryStore.js";

export const submitContactMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (getDbConnectionStatus()) {
    const contactMsg = await ContactMessage.create({ name, email, subject, message });
    res.status(201).json({
      success: true,
      message: "Thank you for contacting LuxeCart Concierge. Your inquiry has been received.",
      data: contactMsg,
    });
  } else {
    const newMsg = {
      _id: "msg_" + Date.now(),
      name,
      email,
      subject,
      message,
      status: "unread",
      replyNotes: "",
      createdAt: new Date(),
    };
    memoryStore.contactMessages.unshift(newMsg);
    res.status(201).json({
      success: true,
      message: "Thank you for contacting LuxeCart Concierge. Your inquiry has been received.",
      data: newMsg,
    });
  }
});

export const getContactMessages = asyncHandler(async (req, res) => {
  if (getDbConnectionStatus()) {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: messages });
  } else {
    res.status(200).json({ success: true, data: memoryStore.contactMessages });
  }
});

export const updateMessageStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, replyNotes } = req.body;

  if (getDbConnectionStatus()) {
    const msg = await ContactMessage.findById(id);
    if (!msg) throw new ApiError(404, "Message not found");

    if (status) msg.status = status;
    if (replyNotes !== undefined) msg.replyNotes = replyNotes;
    await msg.save();

    res.status(200).json({ success: true, message: "Message updated", data: msg });
  } else {
    const msg = memoryStore.contactMessages.find((m) => m._id.toString() === id.toString());
    if (!msg) throw new ApiError(404, "Message not found");

    if (status) msg.status = status;
    if (replyNotes !== undefined) msg.replyNotes = replyNotes;

    res.status(200).json({ success: true, message: "Message updated", data: msg });
  }
});

export const getStoreSettings = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: memoryStore.settings,
  });
});

export const updateStoreSettings = asyncHandler(async (req, res) => {
  memoryStore.settings = {
    ...memoryStore.settings,
    ...req.body,
  };

  res.status(200).json({
    success: true,
    message: "Store settings updated",
    data: memoryStore.settings,
  });
});
