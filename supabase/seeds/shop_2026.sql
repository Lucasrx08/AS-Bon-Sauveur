-- Catalogue repris de la boutique HelloAsso fournie par Lucas. À appliquer lors de la mise en ligne validée.
insert into public.v20_products(id,name,price,color,image,deadline,active) values
('as-2026-rose-floque','Sweat Rose - Logo floqué',22,'Rose','https://cdn.helloasso.com/img/photos/items/shops/cropped-image-5d16e19387ec41b49de990a795b9bb29.png','2026-12-01',true),
('as-2026-rose-brode','Sweat Rose - Logo brodé',26,'Rose','https://cdn.helloasso.com/img/photos/items/shops/cropped-image-5d16e19387ec41b49de990a795b9bb29.png','2026-12-01',true),
('as-2026-bleu-floque','Sweat Bleu - Logo floqué',22,'Bleu','https://cdn.helloasso.com/img/photos/items/shops/cropped-image-868eac930a524ec7a3974b4eb477a6bf.png','2026-12-01',true),
('as-2026-bleu-brode','Sweat Bleu - Logo brodé',26,'Bleu','https://cdn.helloasso.com/img/photos/items/shops/cropped-image-868eac930a524ec7a3974b4eb477a6bf.png','2026-12-01',true),
('as-2026-gris-floque','Sweat Gris - Logo floqué',22,'Gris','https://cdn.helloasso.com/img/photos/items/shops/cropped-image-8ccc4192c49b47a4ab8fa2c261e4a610.png','2026-12-01',true),
('as-2026-gris-brode','Sweat Gris - Logo brodé',26,'Gris','https://cdn.helloasso.com/img/photos/items/shops/cropped-image-8ccc4192c49b47a4ab8fa2c261e4a610.png','2026-12-01',true),
('as-2026-tee-floque','Tee-shirt Bleu ciel - Logo floqué',10,'Bleu ciel','https://cdn.helloasso.com/img/photos/items/shops/cropped-image-604ae204fd05465ba3609c2e799e890f.png','2026-12-01',true),
('as-2026-tee-brode','Tee-shirt Bleu ciel - Logo brodé',12,'Bleu ciel','https://cdn.helloasso.com/img/photos/items/shops/cropped-image-604ae204fd05465ba3609c2e799e890f.png','2026-12-01',true)
on conflict(id) do nothing;
