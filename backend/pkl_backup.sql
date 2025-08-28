--
-- Table structure for table `data_layanan`
--

DROP TABLE IF EXISTS `data_layanan`;
CREATE TABLE `data_layanan` (
  `service_no` varchar(50) NOT NULL,
  `alamat` text NOT NULL,
  PRIMARY KEY (`service_no`)
);

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports` (
  `incident` varchar(255) NOT NULL,
  `ticket_id_gamas` varchar(255) DEFAULT NULL,
  `external_ticket_id` varchar(255) DEFAULT NULL,
  `customer_id` varchar(255) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `service_id` varchar(255) DEFAULT NULL,
  `service_no` varchar(255) DEFAULT NULL,
  `summary` text,
  `description_assignment` text,
  `reported_date` datetime DEFAULT NULL,
  `reported_by` varchar(255) DEFAULT NULL,
  `reported_priority` varchar(255) DEFAULT NULL,
  `source_ticket` varchar(255) DEFAULT NULL,
  `channel` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(255) DEFAULT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `status_date` datetime DEFAULT NULL,
  `booking_date` datetime DEFAULT NULL,
  `resolve_date` datetime DEFAULT NULL,
  `date_modified` datetime DEFAULT NULL,
  `last_update_worklog` text,
  `closed_by` varchar(255) DEFAULT NULL,
  `closed_reopen_by` varchar(255) DEFAULT NULL,
  `guarantee_status` varchar(255) DEFAULT NULL,
  `ttr_customer` varchar(255) DEFAULT NULL,
  `ttr_agent` varchar(255) DEFAULT NULL,
  `ttr_mitra` varchar(255) DEFAULT NULL,
  `ttr_nasional` varchar(255) DEFAULT NULL,
  `ttr_pending` varchar(255) DEFAULT NULL,
  `ttr_region` varchar(255) DEFAULT NULL,
  `ttr_witel` varchar(255) DEFAULT NULL,
  `ttr_end_to_end` varchar(255) DEFAULT NULL,
  `owner_group` varchar(255) DEFAULT NULL,
  `owner` varchar(255) DEFAULT NULL,
  `witel` varchar(255) DEFAULT NULL,
  `workzone` varchar(255) DEFAULT NULL,
  `region` varchar(255) DEFAULT NULL,
  `subsidiary` varchar(255) DEFAULT NULL,
  `territory_near_end` varchar(255) DEFAULT NULL,
  `territory_far_end` varchar(255) DEFAULT NULL,
  `customer_segment` varchar(255) DEFAULT NULL,
  `customer_type` varchar(255) DEFAULT NULL,
  `customer_category` varchar(255) DEFAULT NULL,
  `service_type` varchar(255) DEFAULT NULL,
  `slg` varchar(255) DEFAULT NULL,
  `technology` varchar(255) DEFAULT NULL,
  `lapul` varchar(255) DEFAULT NULL,
  `gaul` varchar(255) DEFAULT NULL,
  `onu_rx` varchar(255) DEFAULT NULL,
  `pending_reason` text,
  `incident_domain` varchar(255) DEFAULT NULL,
  `symptom` text,
  `hierarchy_path` text,
  `solution` text,
  `description_actual_solution` text,
  `kode_produk` varchar(255) DEFAULT NULL,
  `perangkat` varchar(255) DEFAULT NULL,
  `technician` varchar(255) DEFAULT NULL,
  `device_name` varchar(255) DEFAULT NULL,
  `sn_ont` varchar(255) DEFAULT NULL,
  `tipe_ont` varchar(255) DEFAULT NULL,
  `manufacture_ont` varchar(255) DEFAULT NULL,
  `impacted_site` varchar(255) DEFAULT NULL,
  `cause` text,
  `resolution` text,
  `worklog_summary` text,
  `classification_flag` varchar(255) DEFAULT NULL,
  `realm` varchar(255) DEFAULT NULL,
  `related_to_gamas` varchar(255) DEFAULT NULL,
  `tsc_result` varchar(255) DEFAULT NULL,
  `scc_result` varchar(255) DEFAULT NULL,
  `note` text,
  `notes_eskalasi` text,
  `rk_information` text,
  `external_ticket_tier_3` varchar(255) DEFAULT NULL,
  `classification_path` text,
  `urgency` varchar(255) DEFAULT NULL,
  `alamat` text,
  `korlap` varchar(255) DEFAULT NULL,
  `sektor` varchar(50) NOT NULL,
  PRIMARY KEY (`incident`)
);

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` VALUES ('INC-TEST-DARI-EXCEL-001',NULL,NULL,NULL,NULL,NULL,'152703233086','Testing input data baru ke MySQL.',NULL,'2025-07-31 16:00:00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'BACKEND',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'MALANG',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Perumahan Joyogrand Inside, No. C34 DESA MERJOSARI MALANG  CP = wa.me/6282232324561',NULL,'MLG 2'),('INC-TEST-DARI-EXCEL-003',NULL,NULL,NULL,NULL,NULL,'152710202841','Testing input Part 3.',NULL,'2025-08-08 13:00:00',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'NEW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'MALANG','BLB',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'A YANI 6 DESA SUKOLILO JABUNG MALANG  CP = wa.me/6282142614405','@Endrasakti','MLG 1'),('INC38580092','','','','','1-MOUEVP2','152701238328','WAJIB DIISI MSISDN CONTACT PELANGGAN 085852387143',NULL,'2025-08-10 02:42:15','23255804','','CUSTOMER','1-NOL1KRM','6285852387143','IKA','','BACKEND','2025-08-10 02:42:20',NULL,NULL,NULL,NULL,'REGULER',NULL,NULL,'01:56:01','N/A | N/A','','00:00:00','00:00:00','01:56:01','00:00:00','01:56:01','TIF HD DISTRICT MALANG','','MALANG',NULL,'2025-08-12 19:38:21','',NULL,NULL,'PL-TSEL','21','ODC-BTU-FX ODC-BTU-FX','INTERNET','1-MOUEVP2_152707234425_INTERNET','152707234425','','Fiber','0','0','','','REG-5','INTERNET | TECHNICAL | Tidak Bisa Browsing - 2P / 3P Mati Total','','','','','','NOT GUARANTEE','','ZTEGD826190E','ZTEG-F672Y','','','16830458','','','TECHNICAL','telkom.net','NO','01:56:01','','','','INC000015453134','','JL ZAENAL ZAKSE GG 1C NO 24 RT 010 RW 001 MALANG (SEBELAH WARUNG SATE RAWON PAK ATENG) CP = wa.me/6287740243620',NULL,'MLG 3'),('INC38587292','','','','','1-MOUEVP2','152702316059','WAJIB DIISI MSISDN CONTACT PELANGGAN 085852387143',NULL,'2024-08-11 06:42:15','23255804','','CUSTOMER','1-NOL1KRM','6285852387143','IKA','','BACKEND','2025-08-11 06:42:20',NULL,NULL,NULL,NULL,'REGULER',NULL,NULL,'01:56:01','N/A | N/A','','00:00:00','00:00:00','01:56:01','00:00:00','01:56:01','TIF HD DISTRICT MALANG','','MALANG',NULL,'2025-08-12 19:38:21','',NULL,NULL,'PL-TSEL','21','ODC-BTU-FX ODC-BTU-FX','INTERNET','1-MOUEVP2_152707234425_INTERNET','152707234425','','Fiber','0','0','','','REG-5','INTERNET | TECHNICAL | Tidak Bisa Browsing - 2P / 3P Mati Total','','','','','','NOT GUARANTEE','','ZTEGD826190E','ZTEG-F672Y','','','16830458','','','TECHNICAL','telkom.net','NO','01:56:01','','','','INC000015453134','','Perumh RIVER PLACE RP2-10 DESA KEPUH HARJO KPO MALANG  CP = wa.me/6282335392899',NULL,'MLG 2');

--
-- Table structure for table `work_orders`
--

DROP TABLE IF EXISTS `work_orders`;
CREATE TABLE `work_orders` (
  `incident` varchar(255) NOT NULL,
  `ticket_id_gamas` varchar(255) DEFAULT NULL,
  `external_ticket_id` varchar(255) DEFAULT NULL,
  `customer_id` varchar(255) DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `service_id` varchar(255) DEFAULT NULL,
  `service_no` varchar(255) DEFAULT NULL,
  `summary` text,
  `description_assignment` text,
  `reported_date` datetime DEFAULT NULL,
  `reported_by` varchar(255) DEFAULT NULL,
  `reported_priority` varchar(255) DEFAULT NULL,
  `source_ticket` varchar(255) DEFAULT NULL,
  `channel` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(100) DEFAULT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `status` varchar(100) DEFAULT NULL,
  `status_date` datetime DEFAULT NULL,
  `booking_date` datetime DEFAULT NULL,
  `resolve_date` datetime DEFAULT NULL,
  `date_modified` datetime DEFAULT NULL,
  `last_update_worklog` datetime DEFAULT NULL,
  `closed_by` varchar(255) DEFAULT NULL,
  `closed_reopen_by` varchar(255) DEFAULT NULL,
  `guarantee_status` varchar(100) DEFAULT NULL,
  `ttr_customer` varchar(50) DEFAULT NULL,
  `ttr_agent` varchar(50) DEFAULT NULL,
  `ttr_mitra` varchar(50) DEFAULT NULL,
  `ttr_nasional` varchar(50) DEFAULT NULL,
  `ttr_pending` varchar(50) DEFAULT NULL,
  `ttr_region` varchar(50) DEFAULT NULL,
  `ttr_witel` varchar(50) DEFAULT NULL,
  `ttr_end_to_end` varchar(50) DEFAULT NULL,
  `owner_group` varchar(255) DEFAULT NULL,
  `owner` varchar(255) DEFAULT NULL,
  `witel` varchar(255) DEFAULT NULL,
  `workzone` varchar(255) DEFAULT NULL,
  `region` varchar(255) DEFAULT NULL,
  `subsidiary` varchar(255) DEFAULT NULL,
  `territory_near_end` varchar(255) DEFAULT NULL,
  `territory_far_end` varchar(255) DEFAULT NULL,
  `customer_segment` varchar(255) DEFAULT NULL,
  `customer_type` varchar(255) DEFAULT NULL,
  `customer_category` varchar(255) DEFAULT NULL,
  `service_type` varchar(255) DEFAULT NULL,
  `slg` varchar(100) DEFAULT NULL,
  `technology` varchar(100) DEFAULT NULL,
  `lapul` varchar(100) DEFAULT NULL,
  `gaul` varchar(100) DEFAULT NULL,
  `onu_rx` varchar(50) DEFAULT NULL,
  `pending_reason` text,
  `incident_domain` varchar(255) DEFAULT NULL,
  `symptom` text,
  `hierarchy_path` text,
  `solution` text,
  `description_actual_solution` text,
  `kode_produk` varchar(255) DEFAULT NULL,
  `perangkat` varchar(255) DEFAULT NULL,
  `technician` varchar(255) DEFAULT NULL,
  `device_name` varchar(255) DEFAULT NULL,
  `sn_ont` varchar(255) DEFAULT NULL,
  `tipe_ont` varchar(255) DEFAULT NULL,
  `manufacture_ont` varchar(255) DEFAULT NULL,
  `impacted_site` text,
  `cause` text,
  `resolution` text,
  `worklog_summary` text,
  `classification_flag` varchar(50) DEFAULT NULL,
  `realm` varchar(255) DEFAULT NULL,
  `related_to_gamas` varchar(255) DEFAULT NULL,
  `tsc_result` text,
  `scc_result` text,
  `note` text,
  `notes_eskalasi` text,
  `rk_information` text,
  `external_ticket_tier_3` varchar(255) DEFAULT NULL,
  `classification_path` text,
  `urgency` varchar(50) DEFAULT NULL,
  `alamat` text,
  `korlap` varchar(255) DEFAULT NULL,
  `sektor` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`incident`)
);

--
-- Table structure for table `workzone_details`
--

DROP TABLE IF EXISTS `workzone_details`;
CREATE TABLE `workzone_details` (
  `id` int NOT NULL,
  `workzone` varchar(10) NOT NULL,
  `korlap_username` varchar(255) NOT NULL,
  `sektor` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
);

--
-- Dumping data for table `workzone_details`
--

INSERT INTO `workzone_details` VALUES (1,'BLB','@nicosuryanata','MLG 1'),(2,'BLB','@hndika','MLG 1'),(3,'BLB','@triyuni75','MLG 1'),(4,'BLB','@Endrasakti','MLG 1'),(5,'KLJ','@rolimartin','MLG 1'),(6,'KLJ','@JackSpaarroww','MLG 1'),(7,'KLJ','@firdausmulia','MLG 1'),(8,'KLJ','@YantiMohadi','MLG 1'),(9,'SGS','@iqbal_albana','MLG 2'),(10,'SGS','@merin97','MLG 2'),(11,'SGS','@RizkyAHermawan','MLG 2'),(12,'SGS','@Choliz87','MLG 2'),(13,'SGS','@agungspoetra','MLG 2'),(14,'PKS','@iqbal_albana','MLG 2'),(15,'PKS','@merin97','MLG 2'),(16,'PKS','@RizkyAHermawan','MLG 2'),(17,'PKS','@Choliz87','MLG 2'),(18,'PKS','@agungspoetra','MLG 2'),(19,'LWG','@iqbal_albana','MLG 2'),(20,'LWG','@merin97','MLG 2'),(21,'LWG','@RizkyAHermawan','MLG 2'),(22,'LWG','@Choliz87','MLG 2'),(23,'LWG','@agungspoetra','MLG 2'),(24,'TMP','@iqbal_albana','MLG 2'),(25,'TMP','@merin97','MLG 2'),(26,'TMP','@RizkyAHermawan','MLG 2'),(27,'TMP','@Choliz87','MLG 2'),(28,'TMP','@agungspoetra','MLG 2'),(29,'SWJ','@iqbal_albana','MLG 2'),(30,'SWJ','@merin97','MLG 2'),(31,'SWJ','@RizkyAHermawan','MLG 2'),(32,'SWJ','@Choliz87','MLG 2'),(33,'SWJ','@agungspoetra','MLG 2'),(34,'BRG','@iqbal_albana','MLG 2'),(35,'BRG','@merin97','MLG 2'),(36,'BRG','@RizkyAHermawan','MLG 2'),(37,'BRG','@Choliz87','MLG 2'),(38,'BRG','@agungspoetra','MLG 2'),(39,'MLG','@huliaihzlq','MLG 3'),(40,'MLG','@Rizkymaulana_06','MLG 3'),(41,'MLG','@Kikuch','MLG 3'),(42,'MLG','@anovitass','MLG 3'),(43,'GDG','@azislutfi','MLG 3'),(44,'GDG','@anindya_putra','MLG 3'),(45,'GDG','@alibassss','MLG 3'),(46,'GDG','@bimalaksana90','MLG 3'),(47,'TUR','@mochammadmulya','MLG 3'),(48,'TUR','@Penjozasmara','MLG 3'),(49,'TUR','@ipunklutfy','MLG 3'),(50,'TUR','@Gotam27','MLG 3'),(51,'GDI','@mochammadmulya','MLG 3'),(52,'GDI','@Penjozasmara','MLG 3'),(53,'GDI','@ipunklutfy','MLG 3'),(54,'GDI','@Gotam27','MLG 3'),(55,'BNR','@mochammadmulya','MLG 3'),(56,'BNR','@Penjozasmara','MLG 3'),(57,'BNR','@ipunklutfy','MLG 3'),(58,'BNR','@Gotam27','MLG 3'),(59,'DPT','@mochammadmulya','MLG 3'),(60,'DPT','@Penjozasmara','MLG 3'),(61,'DPT','@ipunklutfy','MLG 3'),(62,'DPT','@Gotam27','MLG 3'),(63,'SBM','@mochammadmulya','MLG 3'),(64,'SBM','@Penjozasmara','MLG 3'),(65,'SBM','@ipunklutfy','MLG 3'),(66,'SBM','@Gotam27','MLG 3'),(67,'APG','@mochammadmulya','MLG 3'),(68,'APG','@Penjozasmara','MLG 3'),(69,'APG','@ipunklutfy','MLG 3'),(70,'APG','@Gotam27','MLG 3'),(71,'KEP','@azislutfi','MLG 3'),(72,'KEP','@anindya_putra','MLG 3'),(73,'KEP','@alibassss','MLG 3'),(74,'KEP','@bimalaksana90','MLG 3'),(75,'SBP','@azislutfi','MLG 3'),(76,'SBP','@anindya_putra','MLG 3'),(77,'SBP','@alibassss','MLG 3'),(78,'SBP','@bimalaksana90','MLG 3'),(79,'GKW','@azislutfi','MLG 3'),(80,'GKW','@anindya_putra','MLG 3'),(81,'GKW','@alibassss','MLG 3'),(82,'GKW','@bimalaksana90','MLG 3'),(83,'DNO','@azislutfi','MLG 3'),(84,'DNO','@anindya_putra','MLG 3'),(85,'DNO','@alibassss','MLG 3'),(86,'DNO','@bimalaksana90','MLG 3'),(87,'PGK','@azislutfi','MLG 3'),(88,'PGK','@anindya_putra','MLG 3'),(89,'PGK','@alibassss','MLG 3'),(90,'PGK','@bimalaksana90','MLG 3'),(91,'BTU','@arishere','MLG 4'),(92,'BTU','@Flyco','MLG 4'),(93,'BTU','@aanksueb','MLG 4'),(94,'BTU','@diditdwif','MLG 4'),(95,'BTU','@athunk05','MLG 4'),(96,'NTG','@arishere','MLG 4'),(97,'NTG','@Flyco','MLG 4'),(98,'NTG','@aanksueb','MLG 4'),(99,'NTG','@diditdwif','MLG 4'),(100,'NTG','@athunk05','MLG 4'),(101,'KPO','@arishere','MLG 4'),(102,'KPO','@Flyco','MLG 4'),(103,'KPO','@aanksueb','MLG 4'),(104,'KPO','@diditdwif','MLG 4'),(105,'KPO','@athunk05','MLG 4');