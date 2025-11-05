-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 04-11-2025 a las 20:42:20
-- Versión del servidor: 10.4.27-MariaDB
-- Versión de PHP: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `artemis`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `admin_logs`
--

CREATE TABLE `admin_logs` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `action_type` enum('delete_user','delete_book','delete_chapter','promote_librarian','demote_librarian','review_report') NOT NULL,
  `target_user_id` int(11) DEFAULT NULL,
  `target_book_id` int(11) DEFAULT NULL,
  `target_chapter_id` int(11) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `admin_logs`
--

INSERT INTO `admin_logs` (`id`, `admin_id`, `action_type`, `target_user_id`, `target_book_id`, `target_chapter_id`, `details`, `created_at`) VALUES
(1, 6, 'delete_book', 2, 11, NULL, 'Libro \"pepe\" eliminado', '2025-11-03 20:19:26'),
(2, 6, 'delete_user', 2, NULL, NULL, 'Usuario eliminado por admin 6', '2025-11-03 20:19:29'),
(3, 6, 'promote_librarian', 4, NULL, NULL, 'Usuario promovido a bibliotecario', '2025-11-03 20:29:23'),
(4, 6, 'promote_librarian', 3, NULL, NULL, 'Usuario promovido a bibliotecario', '2025-11-03 20:31:58'),
(5, 6, 'delete_user', 1, NULL, NULL, 'Usuario eliminado por admin 6', '2025-11-03 20:41:57'),
(6, 6, 'delete_user', 7, NULL, NULL, 'Usuario eliminado por admin 6', '2025-11-03 23:18:24'),
(7, 6, 'demote_librarian', 4, NULL, NULL, 'Rol de bibliotecario removido', '2025-11-03 23:26:43'),
(8, 6, 'promote_librarian', 4, NULL, NULL, 'Usuario promovido a bibliotecario', '2025-11-03 23:26:47');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `admin_notifications`
--

CREATE TABLE `admin_notifications` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `report_id` int(11) NOT NULL,
  `notification_type` enum('new_report','report_update') DEFAULT 'new_report',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `admin_notifications`
--

INSERT INTO `admin_notifications` (`id`, `admin_id`, `report_id`, `notification_type`, `is_read`, `created_at`, `read_at`) VALUES
(3, 6, 3, 'new_report', 0, '2025-11-04 16:06:35', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `books`
--

CREATE TABLE `books` (
  `id` int(11) NOT NULL,
  `writer_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `genre` varchar(100) DEFAULT NULL,
  `synopsis` text DEFAULT NULL,
  `cover_image_url` varchar(255) DEFAULT NULL,
  `type` enum('upload','in_app') DEFAULT 'in_app',
  `file_url` varchar(255) DEFAULT NULL,
  `status` enum('draft','submitted','published','rejected') DEFAULT 'draft',
  `published_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `books`
--

INSERT INTO `books` (`id`, `writer_id`, `title`, `genre`, `synopsis`, `cover_image_url`, `type`, `file_url`, `status`, `published_at`, `created_at`, `updated_at`) VALUES
(1, 2, 'qwe', 'qwe', 'qwe', 'qwe', 'in_app', NULL, 'draft', NULL, '2025-10-26 01:20:17', '2025-10-26 01:20:17'),
(2, 2, 'asd', 'asda', 'asdas', 'dasdasd', 'in_app', NULL, 'draft', NULL, '2025-10-26 01:20:36', '2025-10-26 01:20:36'),
(3, 2, 'sadas', 'asdasd', 'asdasd', 'asdasd', 'in_app', NULL, 'draft', NULL, '2025-10-26 01:25:21', '2025-10-26 01:25:21'),
(4, 2, 'asd', 'asd', 'asd', 'asd', 'in_app', NULL, 'draft', NULL, '2025-10-26 01:29:13', '2025-10-26 01:29:13'),
(5, 2, 'asd', 'asd', 'asd', 'asd', 'in_app', NULL, 'draft', NULL, '2025-10-26 01:29:22', '2025-10-26 01:29:22'),
(6, 2, 'asdas', 'asdas', 'dasd', 'asdasda', 'in_app', NULL, 'draft', NULL, '2025-10-26 01:32:07', '2025-10-26 01:32:07'),
(7, 2, 'asda', 'asd', 'asdas', 'https://via.placeholder.com/300x400', 'in_app', NULL, 'draft', NULL, '2025-10-26 01:33:03', '2025-10-26 01:33:03'),
(8, 2, 'asda', 'asdas', 'asdas', 'asdas', 'in_app', NULL, 'draft', NULL, '2025-10-26 18:27:35', '2025-10-26 18:27:35'),
(9, 2, 'asdas', 'asdas', 'dasdas', 'dasdasd', 'in_app', NULL, 'draft', NULL, '2025-10-26 18:28:27', '2025-10-26 18:28:27'),
(10, 2, 'asdas', 'asd', 'asdas', 'asd', 'in_app', NULL, 'draft', NULL, '2025-10-26 18:41:12', '2025-10-26 18:41:12'),
(12, 3, 'asdasd', 'Fantasía', 'xd lol', 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.primevideo.com%2F-%2Fes%2Fdetail%2FHarry-Potter-Y-La-Piedra-Filosofal%2F0JXM9K5QSXG0X1O6M4CHGIYACB&psig=AOvVaw2zgFJs6sLg299WGXLRjeHF&ust=1762217781835000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxq', 'in_app', NULL, 'published', '2025-11-03 23:20:14', '2025-10-26 20:06:30', '2025-11-04 02:20:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `book_views`
--

CREATE TABLE `book_views` (
  `id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `viewed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla que registra las visualizaciones únicas de libros por usuario';

--
-- Volcado de datos para la tabla `book_views`
--

INSERT INTO `book_views` (`id`, `book_id`, `user_id`, `viewed_at`) VALUES
(8, 11, 1, '2025-11-02 20:12:02'),
(3, 11, 3, '2025-11-03 01:15:52'),
(69, 11, 4, '2025-11-03 19:10:02'),
(71, 11, 6, '2025-11-03 23:19:07'),
(6, 12, 1, '2025-11-02 21:17:10'),
(1, 12, 3, '2025-11-04 19:13:37'),
(67, 12, 4, '2025-11-04 19:06:28'),
(81, 12, 6, '2025-11-04 18:43:54'),
(79, 12, 8, '2025-11-04 02:38:28'),
(87, 12, 9, '2025-11-04 18:46:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `chapters`
--

CREATE TABLE `chapters` (
  `id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `chapter_number` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `chapters`
--

INSERT INTO `chapters` (`id`, `book_id`, `chapter_number`, `title`, `content`, `created_at`, `updated_at`) VALUES
(1, 12, 1, 'asdasd', 'hola mi nombre es juani xd me garcho a garcia todas las noches\nasd\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nasdasdasdasdasdas', '2025-10-26 20:24:43', '2025-11-02 20:15:03'),
(2, 11, 1, 'capitulo 1', 'asdasdasdasdasd', '2025-10-26 23:58:51', '2025-10-27 01:52:11'),
(3, 12, 2, 'asdasdasd', 'asdawsdasd hola munndo', '2025-11-02 20:10:24', '2025-11-04 02:20:11'),
(4, 12, 3, 'asdasdasdas', 'asdasdasda', '2025-11-02 21:42:10', '2025-11-02 21:42:10'),
(5, 10, 1, 'dsadsad', 'asdas', '2025-11-03 23:03:55', '2025-11-03 23:03:55');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `content` text NOT NULL,
  `book_id` int(11) DEFAULT NULL COMMENT 'NULL si es comentario de capítulo',
  `chapter_id` int(11) DEFAULT NULL COMMENT 'NULL si es comentario de libro',
  `user_id` int(11) NOT NULL,
  `parent_comment_id` int(11) DEFAULT NULL COMMENT 'Para respuestas a comentarios',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `comments`
--

INSERT INTO `comments` (`id`, `content`, `book_id`, `chapter_id`, `user_id`, `parent_comment_id`, `created_at`, `updated_at`) VALUES
(1, 'asdasdas', 12, NULL, 3, NULL, '2025-11-02 23:06:41', '2025-11-02 23:06:41'),
(2, 'asdasdasd', 12, NULL, 3, NULL, '2025-11-02 23:08:35', '2025-11-02 23:08:35'),
(3, 'asdasd', 12, NULL, 3, NULL, '2025-11-02 23:12:02', '2025-11-02 23:12:02'),
(4, 'holaaaaaaaaaaaaaaa', 12, NULL, 3, NULL, '2025-11-04 02:20:29', '2025-11-04 02:20:29');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `content_reports`
--

CREATE TABLE `content_reports` (
  `id` int(11) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `book_id` int(11) DEFAULT NULL,
  `chapter_id` int(11) DEFAULT NULL,
  `report_type` enum('inappropriate_book','inappropriate_chapter') NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','reviewed','dismissed') DEFAULT 'pending',
  `admin_notes` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `content_reports`
--

INSERT INTO `content_reports` (`id`, `reporter_id`, `book_id`, `chapter_id`, `report_type`, `reason`, `status`, `admin_notes`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`) VALUES
(1, 4, 12, NULL, 'inappropriate_book', 'sdasdas', 'dismissed', 'dasdasdasd', 6, '2025-11-04 07:57:04', '2025-11-04 07:46:18', '2025-11-04 07:57:04'),
(2, 4, 12, NULL, 'inappropriate_book', 'asdas', 'dismissed', 'asdasd', 6, '2025-11-04 15:42:05', '2025-11-04 15:40:21', '2025-11-04 15:42:05'),
(3, 4, 12, NULL, 'inappropriate_book', 'dsf', 'pending', NULL, NULL, NULL, '2025-11-04 16:06:35', '2025-11-04 16:06:35'),
(4, 3, 12, NULL, 'inappropriate_book', 'ui', 'dismissed', 'asdas', 6, '2025-11-04 16:21:54', '2025-11-04 16:17:23', '2025-11-04 16:21:54');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dislikes`
--

CREATE TABLE `dislikes` (
  `id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `dislikes`
--

INSERT INTO `dislikes` (`id`, `book_id`, `user_id`, `created_at`) VALUES
(25, 11, 3, '2025-11-02 21:01:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `likes`
--

CREATE TABLE `likes` (
  `id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `likes`
--

INSERT INTO `likes` (`id`, `book_id`, `user_id`, `created_at`) VALUES
(2, 11, 2, '2025-10-27 18:58:41'),
(26, 12, 1, '2025-11-02 21:17:14'),
(31, 11, 4, '2025-11-03 19:10:03'),
(34, 12, 3, '2025-11-04 02:20:23'),
(35, 12, 4, '2025-11-04 02:37:52'),
(36, 12, 6, '2025-11-04 18:43:58');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reading_history`
--

CREATE TABLE `reading_history` (
  `id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `completed` tinyint(1) DEFAULT 0,
  `progress` int(11) DEFAULT 0 COMMENT 'Progreso en porcentaje (0-100)',
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  `last_read_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reading_history`
--

INSERT INTO `reading_history` (`id`, `book_id`, `user_id`, `completed`, `progress`, `started_at`, `completed_at`, `last_read_at`) VALUES
(34, 12, 1, 1, 0, '2025-11-02 21:17:16', '2025-11-02 21:17:16', '2025-11-02 21:17:16'),
(39, 11, 3, 1, 0, '2025-11-03 01:15:52', '2025-11-03 01:15:52', '2025-11-03 01:15:52'),
(43, 12, 4, 1, 0, '2025-11-04 02:38:01', '2025-11-04 02:38:01', '2025-11-04 02:38:01'),
(44, 12, 8, 1, 0, '2025-11-04 02:38:29', '2025-11-04 02:38:29', '2025-11-04 02:38:29'),
(45, 12, 6, 1, 0, '2025-11-04 18:43:30', '2025-11-04 18:43:30', '2025-11-04 18:43:30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `role` enum('reader','writer','admin') DEFAULT 'writer',
  `is_librarian` tinyint(1) DEFAULT 0,
  `bio` text DEFAULT NULL,
  `profile_image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `google_id`, `role`, `is_librarian`, `bio`, `profile_image_url`, `created_at`, `updated_at`) VALUES
(3, 'garciamicorazcondemelonelmaslindo', 'papu@gmail.com', '$2b$10$LHPN0Veg0AZT8MojcCEmnONPBLrbdYQAGumbnE8KA7sUc7CyjKBfS', NULL, 'writer', 1, NULL, 'blob:http://localhost:8081/4f569fbb-ea26-4349-8f8a-b68cdcab55a6', '2025-10-26 20:06:02', '2025-11-03 23:31:58'),
(4, 'VALDEZ Juan', 'valdezjuanignacio200789@gmail.com', NULL, '105668398437782997569', 'reader', 1, NULL, 'blob:http://localhost:8081/9f2fca85-b632-4540-8ca9-9762059423cb', '2025-11-03 01:31:39', '2025-11-04 02:26:47'),
(6, 'Nono', 'nono@gmail.com', '$2b$10$xv8SOTOTG38LnSyQ31ObbuT9eZVK2EI8ISeC0aIj0SAoysgpyfrh2', NULL, 'admin', 0, NULL, 'blob:http://localhost:8081/613cb274-84f3-4c1e-abe1-91491543ea23', '2025-11-03 21:19:40', '2025-11-04 02:17:10'),
(8, 'Pototero 96', 'pototero96@gmail.com', NULL, '100232839302231903074', 'writer', 0, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocLLFrK583OW2UFIJnAZ_CXxjMeQrkLeta4s1tRe8wi3-ZCGAds=s96-c', '2025-11-04 02:38:27', '2025-11-04 02:38:27'),
(9, 'dasda', 'papu2@gmail.com', '$2b$10$HFvrEgZfz/ZosicBWybKourUbTwf8wGu7/XMDI4oxl0zQbJ28h3jO', NULL, 'writer', 0, NULL, NULL, '2025-11-04 18:45:49', '2025-11-04 18:45:49');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `target_user_id` (`target_user_id`),
  ADD KEY `target_book_id` (`target_book_id`),
  ADD KEY `target_chapter_id` (`target_chapter_id`),
  ADD KEY `idx_admin` (`admin_id`),
  ADD KEY `idx_action` (`action_type`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indices de la tabla `admin_notifications`
--
ALTER TABLE `admin_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `report_id` (`report_id`),
  ADD KEY `idx_admin` (`admin_id`),
  ADD KEY `idx_read` (`is_read`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indices de la tabla `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_books_status` (`status`),
  ADD KEY `idx_books_writer` (`writer_id`);

--
-- Indices de la tabla `book_views`
--
ALTER TABLE `book_views`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_book_user` (`book_id`,`user_id`),
  ADD KEY `idx_book_id` (`book_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_book_user_view` (`book_id`,`user_id`,`viewed_at`);

--
-- Indices de la tabla `chapters`
--
ALTER TABLE `chapters`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_chapters_book` (`book_id`);

--
-- Indices de la tabla `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_comments_book` (`book_id`),
  ADD KEY `idx_comments_chapter` (`chapter_id`),
  ADD KEY `idx_comments_user` (`user_id`),
  ADD KEY `idx_comments_parent` (`parent_comment_id`),
  ADD KEY `idx_comments_created` (`created_at`);

--
-- Indices de la tabla `content_reports`
--
ALTER TABLE `content_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `book_id` (`book_id`),
  ADD KEY `chapter_id` (`chapter_id`),
  ADD KEY `reviewed_by` (`reviewed_by`),
  ADD KEY `idx_reporter` (`reporter_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `idx_pending_reports` (`status`,`created_at`);

--
-- Indices de la tabla `dislikes`
--
ALTER TABLE `dislikes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_dislike` (`book_id`,`user_id`),
  ADD KEY `idx_dislikes_book` (`book_id`),
  ADD KEY `idx_dislikes_user` (`user_id`);

--
-- Indices de la tabla `likes`
--
ALTER TABLE `likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_like` (`book_id`,`user_id`),
  ADD KEY `idx_likes_book` (`book_id`),
  ADD KEY `idx_likes_user` (`user_id`);

--
-- Indices de la tabla `reading_history`
--
ALTER TABLE `reading_history`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_reading` (`book_id`,`user_id`),
  ADD KEY `idx_reading_history_user` (`user_id`),
  ADD KEY `idx_reading_history_book` (`book_id`),
  ADD KEY `idx_reading_history_completed` (`completed`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `google_id` (`google_id`),
  ADD KEY `idx_librarian` (`is_librarian`,`role`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `admin_logs`
--
ALTER TABLE `admin_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `admin_notifications`
--
ALTER TABLE `admin_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `books`
--
ALTER TABLE `books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `book_views`
--
ALTER TABLE `book_views`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT de la tabla `chapters`
--
ALTER TABLE `chapters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `content_reports`
--
ALTER TABLE `content_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `dislikes`
--
ALTER TABLE `dislikes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de la tabla `likes`
--
ALTER TABLE `likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de la tabla `reading_history`
--
ALTER TABLE `reading_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
