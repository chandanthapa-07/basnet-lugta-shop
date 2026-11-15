import { buildConfig } from "payload";
import { sqliteAdapter } from "@payloadcms/db-sqlite";

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
  secret: process.env.PAYLOAD_SECRET || "dev-secret-change-me",
  admin: {
    user: "admin-users",
  },
  collections: [
    {
      slug: "products",
      labels: { singular: "Product", plural: "Products" },
      access: { read: () => true },
      admin: { useAsTitle: "name" },
      fields: [
        { name: "name", type: "text", required: true, label: "Name" },
        { name: "price", type: "number", required: true, min: 0, label: "Price (NPR)" },
        { name: "stock", type: "number", required: true, min: 0, defaultValue: 0, label: "Stock" },
        {
          name: "category", type: "select", required: true, label: "Category",
          options: [
            { label: "Robes", value: "Robes" },
            { label: "Shawls & Wraps", value: "Shawls & Wraps" },
            { label: "Meditation Wear", value: "Meditation Wear" },
            { label: "Accessories", value: "Accessories" },
          ],
        },
        { name: "badge", type: "text", label: "Badge" },
        { name: "description", type: "textarea", label: "Description" },
        { name: "image", type: "upload", relationTo: "media", required: true, label: "Image" },
        { name: "visible", type: "checkbox", defaultValue: true, label: "Visible in shop" },
        { name: "featured", type: "checkbox", defaultValue: false, label: "Featured" },
      ],
    },
    {
      slug: "media",
      labels: { singular: "Media", plural: "Media" },
      access: { read: () => true },
      upload: {
        imageSizes: [
          { name: "thumbnail", width: 400, height: 400 },
          { name: "card", width: 600, height: 750 },
          { name: "hero", width: 1500, height: 900 },
        ],
      },
      fields: [{ name: "alt", type: "text", label: "Alt text" }],
    },
    {
      slug: "orders",
      labels: { singular: "Order", plural: "Orders" },
      access: {
        read: ({ req }) => req.user?.role === "owner",
        create: () => true,
        update: ({ req }) => req.user?.role === "owner",
        delete: ({ req }) => req.user?.role === "owner",
      },
      admin: { useAsTitle: "orderNumber" },
      fields: [
        { name: "orderNumber", type: "text", required: true, label: "Order number" },
        { name: "customer", type: "relationship", relationTo: "customers", required: true, label: "Customer" },
        {
          name: "items", type: "array", label: "Items",
          fields: [
            { name: "product", type: "relationship", relationTo: "products", required: true },
            { name: "name", type: "text", required: true },
            { name: "price", type: "number", required: true, min: 0 },
            { name: "quantity", type: "number", required: true, min: 1 },
            { name: "image", type: "text" },
          ],
        },
        { name: "subtotal", type: "number", required: true, min: 0, label: "Subtotal (NPR)" },
        {
          name: "status", type: "select", required: true, defaultValue: "New", label: "Status",
          options: [
            { label: "New", value: "New" },
            { label: "Confirmed", value: "Confirmed" },
            { label: "Packed", value: "Packed" },
            { label: "Shipped", value: "Shipped" },
            { label: "Delivered", value: "Delivered" },
            { label: "Cancelled", value: "Cancelled" },
          ],
        },
        {
          name: "paymentStatus", type: "select", required: true, defaultValue: "Unpaid", label: "Payment status",
          options: [
            { label: "Unpaid", value: "Unpaid" },
            { label: "Paid", value: "Paid" },
            { label: "Refunded", value: "Refunded" },
          ],
        },
        { name: "paymentMethod", type: "text", required: true, defaultValue: "Cash on delivery", label: "Payment method" },
        {
          name: "shipping", type: "group", label: "Shipping",
          fields: [
            { name: "name", type: "text", required: true, label: "Full name" },
            { name: "phone", type: "text", required: true, label: "Phone" },
            { name: "district", type: "text", required: true, label: "District" },
            { name: "email", type: "email", label: "Email" },
            { name: "address", type: "text", required: true, label: "Full address" },
            { name: "landmark", type: "text", label: "Nearby landmark" },
            { name: "note", type: "text", label: "Order note" },
          ],
        },
      ],
    },
    {
      slug: "customers",
      labels: { singular: "Customer", plural: "Customers" },
      access: {
        read: ({ req }) => req.user?.role === "owner",
        create: () => true,
        update: ({ req }) => req.user?.role === "owner",
        delete: ({ req }) => req.user?.role === "owner",
      },
      admin: { useAsTitle: "name" },
      fields: [
        { name: "name", type: "text", required: true, label: "Name" },
        { name: "email", type: "email", required: true, unique: true, label: "Email" },
        { name: "passwordHash", type: "text", label: "Password hash" },
      ],
    },
    {
      slug: "admin-users",
      labels: { singular: "Admin User", plural: "Admin Users" },
      auth: true,
      access: {
        read: ({ req }) => req.user?.role === "owner",
        create: ({ req }) => !req.user || req.user?.role === "owner",
        update: ({ req }) => req.user?.role === "owner",
        delete: ({ req }) => req.user?.role === "owner",
      },
      fields: [
        { name: "name", type: "text", required: true, label: "Name" },
        { name: "role", type: "select", options: [
          { label: "Owner", value: "owner" },
          { label: "Admin", value: "admin" },
        ], defaultValue: "owner", label: "Role" },
      ],
    },
  ],
  db: sqliteAdapter({
    client: { url: process.env.DATABASE_URL || "file:./dev.db" },
    push: false,
  }),
});
