-- Catalogue repris de la boutique HelloAsso fournie par Lucas. À appliquer lors de la mise en ligne validée.
insert into public.v20_products(id,name,price,color,image,deadline,active) values
('as-2026-rose-floque','Sweat Rose - Logo floqué',22,'Rose','assets/shop-2026-rose.png','2026-12-01',true),
('as-2026-rose-brode','Sweat Rose - Logo brodé',26,'Rose','assets/shop-2026-rose.png','2026-12-01',true),
('as-2026-bleu-floque','Sweat Bleu - Logo floqué',22,'Bleu','assets/shop-2026-bleu.png','2026-12-01',true),
('as-2026-bleu-brode','Sweat Bleu - Logo brodé',26,'Bleu','assets/shop-2026-bleu.png','2026-12-01',true),
('as-2026-gris-floque','Sweat Gris - Logo floqué',22,'Gris','assets/shop-2026-gris.png','2026-12-01',true),
('as-2026-gris-brode','Sweat Gris - Logo brodé',26,'Gris','assets/shop-2026-gris.png','2026-12-01',true),
('as-2026-tee-floque','Tee-shirt Bleu ciel - Logo floqué',10,'Bleu ciel','assets/shop-2026-tee.png','2026-12-01',true),
('as-2026-tee-brode','Tee-shirt Bleu ciel - Logo brodé',12,'Bleu ciel','assets/shop-2026-tee.png','2026-12-01',true)
on conflict(id) do nothing;
