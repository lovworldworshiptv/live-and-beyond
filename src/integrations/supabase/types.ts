export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      channel_follows: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_follows_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "cms_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_members: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          invited_email: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          invited_email?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          invited_email?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "cms_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_services: {
        Row: {
          channel_id: string
          config: Json
          created_at: string
          display_order: number
          enabled: boolean
          id: string
          service: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          config?: Json
          created_at?: string
          display_order?: number
          enabled?: boolean
          id?: string
          service: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          config?: Json
          created_at?: string
          display_order?: number
          enabled?: boolean
          id?: string
          service?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_services_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "cms_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_channels: {
        Row: {
          banner_url: string | null
          category: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          created_by: string | null
          creator_id: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          display_order: number
          fallback_playlist_id: string | null
          featured_content: string[]
          id: string
          is_live: boolean
          is_published: boolean
          is_trending: boolean
          kind: string
          language: string | null
          logo_url: string | null
          name: string
          now_playing: Json | null
          playout_enabled: boolean
          podcast_library: string[]
          popularity: number
          region: string | null
          setup_completed_at: string | null
          slug: string
          social_links: Json
          stream_url: string | null
          tagline: string | null
          tv_source: string
          updated_at: string
          updated_by: string | null
          video_library: string[]
          viewers: string | null
          website: string | null
        }
        Insert: {
          banner_url?: string | null
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          creator_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          display_order?: number
          fallback_playlist_id?: string | null
          featured_content?: string[]
          id?: string
          is_live?: boolean
          is_published?: boolean
          is_trending?: boolean
          kind?: string
          language?: string | null
          logo_url?: string | null
          name: string
          now_playing?: Json | null
          playout_enabled?: boolean
          podcast_library?: string[]
          popularity?: number
          region?: string | null
          setup_completed_at?: string | null
          slug: string
          social_links?: Json
          stream_url?: string | null
          tagline?: string | null
          tv_source?: string
          updated_at?: string
          updated_by?: string | null
          video_library?: string[]
          viewers?: string | null
          website?: string | null
        }
        Update: {
          banner_url?: string | null
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          creator_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          display_order?: number
          fallback_playlist_id?: string | null
          featured_content?: string[]
          id?: string
          is_live?: boolean
          is_published?: boolean
          is_trending?: boolean
          kind?: string
          language?: string | null
          logo_url?: string | null
          name?: string
          now_playing?: Json | null
          playout_enabled?: boolean
          podcast_library?: string[]
          popularity?: number
          region?: string | null
          setup_completed_at?: string | null
          slug?: string
          social_links?: Json
          stream_url?: string | null
          tagline?: string | null
          tv_source?: string
          updated_at?: string
          updated_by?: string | null
          video_library?: string[]
          viewers?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_channels_fallback_playlist_id_fkey"
            columns: ["fallback_playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_collections: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          name: string
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name: string
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name?: string
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      cms_events: {
        Row: {
          category: string | null
          channel_id: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          is_published: boolean
          is_sponsored: boolean
          name: string
          slug: string
          starts_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          channel_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_published?: boolean
          is_sponsored?: boolean
          name: string
          slug: string
          starts_at: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          channel_id?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_published?: boolean
          is_sponsored?: boolean
          name?: string
          slug?: string
          starts_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_events_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "cms_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_schedule: {
        Row: {
          category: string | null
          channel_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          ends_at: string
          id: string
          is_published: boolean
          program_title: string
          starts_at: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          channel_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          ends_at: string
          id?: string
          is_published?: boolean
          program_title: string
          starts_at: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          channel_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          is_published?: boolean
          program_title?: string
          starts_at?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_schedule_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "cms_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      cms_sponsors: {
        Row: {
          channel_ids: string[]
          created_at: string
          created_by: string | null
          cta_label: string | null
          cta_url: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          ends_at: string | null
          event_ids: string[]
          headline: string | null
          home_sections: string[]
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          placement: string
          placements: string[]
          priority: number
          starts_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          channel_ids?: string[]
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_ids?: string[]
          headline?: string | null
          home_sections?: string[]
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          placement?: string
          placements?: string[]
          priority?: number
          starts_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          channel_ids?: string[]
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_ids?: string[]
          headline?: string | null
          home_sections?: string[]
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          placement?: string
          placements?: string[]
          priority?: number
          starts_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      cms_titles: {
        Row: {
          backdrop_url: string | null
          cast_list: string[]
          channel_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          display_order: number
          duration_label: string | null
          duration_minutes: number | null
          episodes: number | null
          genre: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          kind: string
          poster_url: string | null
          rating: string | null
          seasons: number | null
          slug: string
          stream_url: string | null
          synopsis: string | null
          title: string
          trailer_url: string | null
          updated_at: string
          updated_by: string | null
          year: number | null
        }
        Insert: {
          backdrop_url?: string | null
          cast_list?: string[]
          channel_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          display_order?: number
          duration_label?: string | null
          duration_minutes?: number | null
          episodes?: number | null
          genre?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          kind?: string
          poster_url?: string | null
          rating?: string | null
          seasons?: number | null
          slug: string
          stream_url?: string | null
          synopsis?: string | null
          title: string
          trailer_url?: string | null
          updated_at?: string
          updated_by?: string | null
          year?: number | null
        }
        Update: {
          backdrop_url?: string | null
          cast_list?: string[]
          channel_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          display_order?: number
          duration_label?: string | null
          duration_minutes?: number | null
          episodes?: number | null
          genre?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          kind?: string
          poster_url?: string | null
          rating?: string | null
          seasons?: number | null
          slug?: string
          stream_url?: string | null
          synopsis?: string | null
          title?: string
          trailer_url?: string | null
          updated_at?: string
          updated_by?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_titles_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "cms_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_applications: {
        Row: {
          category: string | null
          channel_name: string | null
          created_at: string
          description: string | null
          id: string
          onboarded_at: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          channel_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          onboarded_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          channel_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          onboarded_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      enterprise_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          org: string | null
          plan: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          org?: string | null
          plan?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          org?: string | null
          plan?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      kingschat_identities: {
        Row: {
          access_token: string | null
          avatar_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          kingschat_user_id: string
          name: string | null
          refresh_token: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          access_token?: string | null
          avatar_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          kingschat_user_id: string
          name?: string | null
          refresh_token?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          access_token?: string | null
          avatar_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          kingschat_user_id?: string
          name?: string | null
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      kingschat_login_attempts: {
        Row: {
          created_at: string
          error: string | null
          id: string
          poll_secret: string
          return_path: string
          session: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          poll_secret: string
          return_path?: string
          session?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          poll_secret?: string
          return_path?: string
          session?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_inputs: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          last_connected_at: string | null
          meta: Json
          playback_dash_url: string | null
          playback_hls_url: string | null
          provider: string
          provider_input_id: string | null
          recording_enabled: boolean
          rtmps_stream_key: string | null
          rtmps_url: string | null
          service: string
          srt_url: string | null
          status: string
          updated_at: string
          webrtc_url: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          last_connected_at?: string | null
          meta?: Json
          playback_dash_url?: string | null
          playback_hls_url?: string | null
          provider?: string
          provider_input_id?: string | null
          recording_enabled?: boolean
          rtmps_stream_key?: string | null
          rtmps_url?: string | null
          service?: string
          srt_url?: string | null
          status?: string
          updated_at?: string
          webrtc_url?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          last_connected_at?: string | null
          meta?: Json
          playback_dash_url?: string | null
          playback_hls_url?: string | null
          provider?: string
          provider_input_id?: string | null
          recording_enabled?: boolean
          rtmps_stream_key?: string | null
          rtmps_url?: string | null
          service?: string
          srt_url?: string | null
          status?: string
          updated_at?: string
          webrtc_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_inputs_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "cms_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          channel_id: string
          created_at: string
          description: string | null
          ended_at: string | null
          id: string
          live_input_id: string | null
          peak_viewers: number
          playback_hls_url: string | null
          poster_url: string | null
          recording_url: string | null
          scheduled_start: string | null
          started_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          live_input_id?: string | null
          peak_viewers?: number
          playback_hls_url?: string | null
          poster_url?: string | null
          recording_url?: string | null
          scheduled_start?: string | null
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          description?: string | null
          ended_at?: string | null
          id?: string
          live_input_id?: string | null
          peak_viewers?: number
          playback_hls_url?: string | null
          poster_url?: string | null
          recording_url?: string | null
          scheduled_start?: string | null
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "cms_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_live_input_id_fkey"
            columns: ["live_input_id"]
            isOneToOne: false
            referencedRelation: "live_inputs"
            referencedColumns: ["id"]
          },
        ]
      }
      login_history: {
        Row: {
          created_at: string
          event: string
          id: string
          ip_address: string | null
          provider: string | null
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          ip_address?: string | null
          provider?: string | null
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          ip_address?: string | null
          provider?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          channel_id: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_seconds: number
          id: string
          media_type: string
          meta: Json
          poster_url: string | null
          source_url: string | null
          status: string
          title: string
          title_id: string | null
          updated_at: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number
          id?: string
          media_type?: string
          meta?: Json
          poster_url?: string | null
          source_url?: string | null
          status?: string
          title: string
          title_id?: string | null
          updated_at?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number
          id?: string
          media_type?: string
          meta?: Json
          poster_url?: string | null
          source_url?: string | null
          status?: string
          title?: string
          title_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "cms_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "cms_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          image_url: string | null
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      playback_events: {
        Row: {
          channel_id: string | null
          created_at: string
          event: string
          id: string
          seconds: number
          service: string
          session_id: string | null
          title_id: string | null
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          event?: string
          id?: string
          seconds?: number
          service?: string
          session_id?: string | null
          title_id?: string | null
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          event?: string
          id?: string
          seconds?: number
          service?: string
          session_id?: string | null
          title_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playback_events_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "cms_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playback_events_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "cms_titles"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_items: {
        Row: {
          created_at: string
          id: string
          media_asset_id: string
          playlist_id: string
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_asset_id: string
          playlist_id: string
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          media_asset_id?: string
          playlist_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_items_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          channel_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          loop_enabled: boolean
          name: string
          service: string
          shuffle: boolean
          updated_at: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          loop_enabled?: boolean
          name: string
          service?: string
          shuffle?: boolean
          updated_at?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          loop_enabled?: boolean
          name?: string
          service?: string
          shuffle?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "cms_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      playout_schedules: {
        Row: {
          channel_id: string
          created_at: string
          created_by: string | null
          days_of_week: number[]
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          playlist_id: string | null
          priority: number
          recurrence: string
          service: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          created_by?: string | null
          days_of_week?: number[]
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          playlist_id?: string | null
          priority?: number
          recurrence?: string
          service?: string
          starts_at: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          created_by?: string | null
          days_of_week?: number[]
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          playlist_id?: string | null
          priority?: number
          recurrence?: string
          service?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playout_schedules_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "cms_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playout_schedules_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          handle: string | null
          id: string
          last_sign_in_at: string | null
          mfa_enrolled: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id: string
          last_sign_in_at?: string | null
          mfa_enrolled?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id?: string
          last_sign_in_at?: string | null
          mfa_enrolled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      radio_settings: {
        Row: {
          bitrate_kbps: number
          channel_id: string
          created_at: string
          format: string
          id: string
          is_enabled: boolean
          metadata_provider: string
          metadata_url: string | null
          now_playing_artist: string | null
          now_playing_artwork_url: string | null
          now_playing_title: string | null
          now_playing_updated_at: string | null
          station_message: string | null
          stream_url: string | null
          updated_at: string
        }
        Insert: {
          bitrate_kbps?: number
          channel_id: string
          created_at?: string
          format?: string
          id?: string
          is_enabled?: boolean
          metadata_provider?: string
          metadata_url?: string | null
          now_playing_artist?: string | null
          now_playing_artwork_url?: string | null
          now_playing_title?: string | null
          now_playing_updated_at?: string | null
          station_message?: string | null
          stream_url?: string | null
          updated_at?: string
        }
        Update: {
          bitrate_kbps?: number
          channel_id?: string
          created_at?: string
          format?: string
          id?: string
          is_enabled?: boolean
          metadata_provider?: string
          metadata_url?: string | null
          now_playing_artist?: string | null
          now_playing_artwork_url?: string | null
          now_playing_title?: string | null
          now_playing_updated_at?: string | null
          station_message?: string | null
          stream_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "radio_settings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "cms_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          handle: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          handle?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          handle?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_manage_channel: {
        Args: { _channel_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "viewer" | "creator" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["viewer", "creator", "admin"],
    },
  },
} as const
