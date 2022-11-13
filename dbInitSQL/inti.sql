CREATE DATABASE torrent;
USE torrent;
CREATE TABLE `t_torrent` (
  `id` VARCHAR(32) NOT NULL COMMENT 'Primary Key',
  `torrentName` varchar(512) DEFAULT NULL COMMENT 'torrent title',
  `torrentHref` varchar(512) DEFAULT NULL COMMENT 'the magnet link for download. Need to add prefix: magnet:?xt=urn:btih:',
  `torrentType` varchar(32) DEFAULT NULL COMMENT 'torrent type. Video, zip, pic etc.',
  `torrentTypeInt` int DEFAULT NULL COMMENT 'video: 0; audio: 1; archiveFile: 2; application: 3; other: 5, DOC: 6',
  `torrentFileCnt` int DEFAULT NULL COMMENT 'the number files contianed in this torrent',
  `torrentSize` varchar(32) DEFAULT NULL COMMENT 'total file size of this torrent',
  `torrentSizeInMB` int DEFAULT NULL COMMENT 'total file size of this torrent in Megabytes',
  `torrentCreateTime` datetime DEFAULT NULL COMMENT 'Create Time in torrent site',
  `torrentSeeders` int DEFAULT NULL COMMENT 'seeders count',
  `torrentLeechers` int DEFAULT NULL COMMENT 'leechers count',
  `website` varchar(32) DEFAULT NULL COMMENT 'the source torrent site',
  `added_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'The time added into mysql DB',
  `pageIndex` int DEFAULT NULL COMMENT 'Which page this torrent was found',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='store torrents';

CREATE TABLE `t_torrent_files` (
  `id` VARCHAR(32) NOT NULL COMMENT 'primary key',
  `fileName` varchar(512) DEFAULT NULL COMMENT 'Create Time in BT4G',
  `extension` varchar(32) DEFAULT NULL COMMENT 'file count in this torrent',
  `fileSize` varchar(32) DEFAULT NULL COMMENT 'file size',
  `fileSizeInMB` int DEFAULT NULL COMMENT 'file sizein Megabytes',
  `torrentId` VARCHAR(32) NOT NULL COMMENT 'foreign Key link to table t_torrent',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5055 DEFAULT CHARSET=utf8mb4 COMMENT='files of seeds';
