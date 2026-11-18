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
      audience_events: {
        Row: {
          channel_id: string | null
          city: string | null
          country: string | null
          created_at: string
          creator_id: string | null
          id: string
          kind: string
          platform: string | null
          service: string | null
          session_id: string | null
          target_type: string
          title_id: string | null
        }
        Insert: {
          channel_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          creator_id?: string | null
          id?: string
          kind: string
          platform?: string | null
          service?: string | null
          session_id?: string | null
          target_type: string
          title_id?: string | null
        }
        Update: {
          channel_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          creator_id?: string | null
          id?: string
          kind?: string
          platform?: string | null
          service?: string | null
          session_id?: string | null
          target_type?: string
          title_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audience_events_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "cms_channels"
            referencedColumns: ["id"]
          },
        ]
      }
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
          notify: boolean
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          notify?: boolean
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          notify?: boolean
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
          library_filter_mode: string
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
          library_filter_mode?: string
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
          library_filter_mode?: string
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
          fresh_override: string
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
          fresh_override?: string
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
          fresh_override?: string
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
      device_push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
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
      hero_requests: {
        Row: {
          admin_note: string | null
          channel_id: string
          content_kind: string
          content_slug: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          ppv_event_id: string | null
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          starts_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          channel_id: string
          content_kind: string
          content_slug?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ppv_event_id?: string | null
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          starts_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          channel_id?: string
          content_kind?: string
          content_slug?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ppv_event_id?: string | null
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          starts_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hero_requests_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "cms_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hero_requests_ppv_event_id_fkey"
            columns: ["ppv_event_id"]
            isOneToOne: false
            referencedRelation: "ppv_events"
            referencedColumns: ["id"]
          },
        ]
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
          device: string | null
          error: string | null
          id: string
          poll_secret: string
          return_path: string
          session: Json | null
          short_code: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          device?: string | null
          error?: string | null
          id?: string
          poll_secret: string
          return_path?: string
          session?: Json | null
          short_code?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          device?: string | null
          error?: string | null
          id?: string
          poll_secret?: string
          return_path?: string
          session?: Json | null
          short_code?: string | null
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
      notification_campaigns: {
        Row: {
          body: string
          created_at: string
          created_by: string
          error: string | null
          id: string
          image_url: string | null
          link: string | null
          push_count: number
          recipient_count: number
          segment: string
          status: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          error?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          push_count?: number
          recipient_count?: number
          segment?: string
          status?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          error?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          push_count?: number
          recipient_count?: number
          segment?: string
          status?: string
          title?: string
        }
        Relationships: []
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
          platform: string | null
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
          platform?: string | null
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
          platform?: string | null
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
      ppv_channel_settings: {
        Row: {
          approval_required: boolean
          channel_id: string
          enabled: boolean
          platform_commission_bps: number | null
          updated_at: string
        }
        Insert: {
          approval_required?: boolean
          channel_id: string
          enabled?: boolean
          platform_commission_bps?: number | null
          updated_at?: string
        }
        Update: {
          approval_required?: boolean
          channel_id?: string
          enabled?: boolean
          platform_commission_bps?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppv_channel_settings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: true
            referencedRelation: "cms_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      ppv_events: {
        Row: {
          admin_note: string
          channel_id: string
          created_at: string
          created_by: string
          description: string
          duration_minutes: number
          event_type: string
          id: string
          platform_commission_bps: number | null
          poster_url: string | null
          price_ngn_minor: number
          price_usd_minor: number
          rental_start_days: number
          replay_hours: number
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_note?: string
          channel_id: string
          created_at?: string
          created_by?: string
          description?: string
          duration_minutes?: number
          event_type?: string
          id?: string
          platform_commission_bps?: number | null
          poster_url?: string | null
          price_ngn_minor: number
          price_usd_minor: number
          rental_start_days?: number
          replay_hours?: number
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_note?: string
          channel_id?: string
          created_at?: string
          created_by?: string
          description?: string
          duration_minutes?: number
          event_type?: string
          id?: string
          platform_commission_bps?: number | null
          poster_url?: string | null
          price_ngn_minor?: number
          price_usd_minor?: number
          rental_start_days?: number
          replay_hours?: number
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppv_events_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "cms_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      ppv_orders: {
        Row: {
          access_expires_at: string
          access_starts_at: string
          amount_minor: number
          commission_bps: number
          created_at: string
          currency: string
          event_id: string
          id: string
          provider: string
          reference: string
          refunded_at: string | null
          sandbox: boolean
          status: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          access_expires_at: string
          access_starts_at: string
          amount_minor: number
          commission_bps?: number
          created_at?: string
          currency?: string
          event_id: string
          id?: string
          provider?: string
          reference: string
          refunded_at?: string | null
          sandbox: boolean
          status?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          access_expires_at?: string
          access_starts_at?: string
          amount_minor?: number
          commission_bps?: number
          created_at?: string
          currency?: string
          event_id?: string
          id?: string
          provider?: string
          reference?: string
          refunded_at?: string | null
          sandbox?: boolean
          status?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ppv_orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ppv_events"
            referencedColumns: ["id"]
          },
        ]
      }
      ppv_platform_settings: {
        Row: {
          enabled: boolean
          id: boolean
          platform_commission_bps: number
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          id?: boolean
          platform_commission_bps?: number
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          id?: boolean
          platform_commission_bps?: number
          updated_at?: string
        }
        Relationships: []
      }
      ppv_playback_assets: {
        Row: {
          event_id: string
          sales_enabled: boolean
          sandbox: boolean
          stream_uid: string
        }
        Insert: {
          event_id: string
          sales_enabled?: boolean
          sandbox?: boolean
          stream_uid: string
        }
        Update: {
          event_id?: string
          sales_enabled?: boolean
          sandbox?: boolean
          stream_uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppv_playback_assets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "ppv_events"
            referencedColumns: ["id"]
          },
        ]
      }
      ppv_receipts: {
        Row: {
          amount_minor: number
          channel_minor: number
          order_id: string
          platform_minor: number
          verified_at: string
        }
        Insert: {
          amount_minor: number
          channel_minor: number
          order_id: string
          platform_minor: number
          verified_at?: string
        }
        Update: {
          amount_minor?: number
          channel_minor?: number
          order_id?: string
          platform_minor?: number
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppv_receipts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "ppv_orders"
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
          artwork_url: string | null
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
          artwork_url?: string | null
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
          artwork_url?: string | null
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
      channel_follower_count: { Args: { _channel_id: string }; Returns: number }
      channel_view_stats: {
        Args: { _channel_id: string; _days?: number }
        Returns: {
          channel_id: string
          service: string
          streams: number
          title_id: string
          unique_viewers: number
          views: number
          watch_seconds: number
        }[]
      }
      confirm_ppv_payment: {
        Args: {
          _amount: number
          _currency: string
          _order_id: string
          _reference: string
          _sandbox: boolean
        }
        Returns: string
      }
      featured_on_demand_rankings: {
        Args: never
        Returns: {
          plays: number
          slug: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      notify_channel_followers: {
        Args: {
          _body: string
          _channel_id: string
          _image: string
          _kind: string
          _link: string
          _title: string
        }
        Returns: undefined
      }
      ppv_playback_gate: {
        Args: { _order_id: string; _user_id: string }
        Returns: {
          access_expires_at: string
          sandbox: boolean
          stream_uid: string
        }[]
      }
      prepare_ppv_order: {
        Args: { _event_id: string; _reference: string; _user_id: string }
        Returns: {
          access_expires_at: string
          access_starts_at: string
          amount_minor: number
          commission_bps: number
          created_at: string
          currency: string
          event_id: string
          id: string
          provider: string
          reference: string
          refunded_at: string | null
          sandbox: boolean
          status: string
          user_id: string
          verified_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "ppv_orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      public_ppv_event: {
        Args: { _id: string }
        Returns: {
          channel_name: string
          channel_slug: string
          description: string
          duration_minutes: number
          event_type: string
          id: string
          poster_url: string
          price_ngn_minor: number
          price_usd_minor: number
          rental_start_days: number
          replay_hours: number
          starts_at: string
          title: string
        }[]
      }
      public_ppv_sales: { Args: { _event_id: string }; Returns: boolean }
      public_ppv_spotlight_ids: {
        Args: never
        Returns: {
          id: string
        }[]
      }
      review_ppv_spotlight: {
        Args: { _approve: boolean; _note: string; _request_id: string }
        Returns: undefined
      }
      trending_on_demand_rankings: {
        Args: never
        Returns: {
          plays: number
          slug: string
        }[]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
